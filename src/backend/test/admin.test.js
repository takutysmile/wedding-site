const test = require('node:test');
const assert = require('node:assert/strict');

// admin.js reads ADMIN_PASSWORD from process.env at require-time, so it must
// be set before the module is first imported.
const ORIGINAL_PASSWORD = process.env.ADMIN_PASSWORD;
process.env.ADMIN_PASSWORD = 'test-secret';
test.after(() => { process.env.ADMIN_PASSWORD = ORIGINAL_PASSWORD; });

const { docClient } = require('../lib/db');
const { handleGetAdminRsvp, handleDeleteAdminRsvp } = require('../routes/admin');

function withMockSend(implementation, fn) {
  const original = docClient.send;
  docClient.send = implementation;
  return fn().finally(() => { docClient.send = original; });
}

test('GET /admin/rsvp — rejects missing Authorization header', async () => {
  const res = await handleGetAdminRsvp({});
  assert.equal(res.statusCode, 401);
});

test('GET /admin/rsvp — rejects wrong password', async () => {
  const res = await handleGetAdminRsvp({ authorization: 'Bearer wrong-password' });
  assert.equal(res.statusCode, 401);
});

test('GET /admin/rsvp — returns items sorted by submitted_at desc with correct password', async () => {
  await withMockSend(async () => ({
    Items: [
      { id: '1', name: 'A', attendance: 'attending', submitted_at: '2026-01-01T00:00:00Z' },
      { id: '2', name: 'B', attendance: 'not_attending', submitted_at: '2026-06-01T00:00:00Z' },
    ],
  }), async () => {
    const res = await handleGetAdminRsvp({ authorization: 'Bearer test-secret' });
    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.body);
    assert.equal(body.count, 2);
    assert.equal(body.items[0].id, '2'); // newest first
  });
});

test('GET /admin/rsvp — returns 500 on DynamoDB failure', async () => {
  await withMockSend(async () => { throw new Error('boom'); }, async () => {
    const res = await handleGetAdminRsvp({ authorization: 'Bearer test-secret' });
    assert.equal(res.statusCode, 500);
  });
});

test('DELETE /admin/rsvp/{id} — rejects missing Authorization header', async () => {
  const res = await handleDeleteAdminRsvp({}, 'some-id');
  assert.equal(res.statusCode, 401);
});

test('DELETE /admin/rsvp/{id} — rejects missing id', async () => {
  const res = await handleDeleteAdminRsvp({ authorization: 'Bearer test-secret' }, '');
  assert.equal(res.statusCode, 400);
});

test('DELETE /admin/rsvp/{id} — succeeds with valid auth and id', async () => {
  let deletedKey;
  await withMockSend(async (cmd) => {
    deletedKey = cmd.input.Key;
    return {};
  }, async () => {
    const res = await handleDeleteAdminRsvp({ authorization: 'Bearer test-secret' }, 'abc-123');
    assert.equal(res.statusCode, 200);
    assert.equal(deletedKey.id, 'abc-123');
  });
});
