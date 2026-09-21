const test = require('node:test');
const assert = require('node:assert/strict');

// routes/admin.js reads ADMIN_PASSWORD from process.env at require-time, so
// it must be set before handler.js (which requires it) is first imported.
process.env.ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'test-secret';

const { docClient } = require('../lib/db');
const { handler } = require('../handler');

function withMockSend(implementation, fn) {
  const original = docClient.send;
  docClient.send = implementation;
  return fn().finally(() => { docClient.send = original; });
}

test('handler — OPTIONS returns 200 with CORS headers', async () => {
  const res = await handler({ requestContext: { http: { method: 'OPTIONS' } }, rawPath: '/api/rsvp' });
  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['Access-Control-Allow-Origin'], '*');
});

test('handler — unknown route returns 404', async () => {
  const res = await handler({ requestContext: { http: { method: 'GET' } }, rawPath: '/api/nope' });
  assert.equal(res.statusCode, 404);
});

test('handler — POST /api/rsvp routes to RSVP handler', async () => {
  await withMockSend(async () => ({}), async () => {
    const res = await handler({
      requestContext: { http: { method: 'POST' } },
      rawPath: '/api/rsvp',
      body: JSON.stringify({ name: '山田太郎', furigana: 'やまだたろう', attendance: 'attending' }),
    });
    assert.equal(res.statusCode, 200);
  });
});

test('handler — decodes base64-encoded body', async () => {
  await withMockSend(async () => ({}), async () => {
    const raw = JSON.stringify({ name: '山田太郎', furigana: 'やまだたろう', attendance: 'attending' });
    const res = await handler({
      requestContext: { http: { method: 'POST' } },
      rawPath: '/api/rsvp',
      body: Buffer.from(raw, 'utf8').toString('base64'),
      isBase64Encoded: true,
    });
    assert.equal(res.statusCode, 200);
  });
});

test('handler — DELETE /api/admin/rsvp/{id} extracts id from path', async () => {
  let deletedKey;
  await withMockSend(async (cmd) => { deletedKey = cmd.input.Key; return {}; }, async () => {
    const res = await handler({
      requestContext: { http: { method: 'DELETE' } },
      rawPath: '/api/admin/rsvp/abc-123',
      headers: { authorization: `Bearer ${process.env.ADMIN_PASSWORD}` },
    });
    assert.equal(res.statusCode, 200);
    assert.equal(deletedKey.id, 'abc-123');
  });
});
