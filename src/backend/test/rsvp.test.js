const test = require('node:test');
const assert = require('node:assert/strict');
const { docClient } = require('../lib/db');
const { handlePostRsvp } = require('../routes/rsvp');

function withMockSend(implementation, fn) {
  const original = docClient.send;
  docClient.send = implementation;
  return fn().finally(() => { docClient.send = original; });
}

test('POST /rsvp — rejects missing body', async () => {
  const res = await handlePostRsvp(null);
  assert.equal(res.statusCode, 400);
  assert.match(JSON.parse(res.body).error, /リクエストボディ/);
});

test('POST /rsvp — rejects invalid JSON', async () => {
  const res = await handlePostRsvp('{not json');
  assert.equal(res.statusCode, 400);
});

test('POST /rsvp — rejects missing name', async () => {
  const res = await handlePostRsvp(JSON.stringify({ attendance: 'attending' }));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.parse(res.body).error, /name は必須/);
});

test('POST /rsvp — rejects name over 50 chars', async () => {
  const res = await handlePostRsvp(JSON.stringify({ name: 'あ'.repeat(51), attendance: 'attending' }));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.parse(res.body).error, /50文字以内/);
});

test('POST /rsvp — rejects missing/invalid attendance', async () => {
  const res = await handlePostRsvp(JSON.stringify({ name: '山田太郎' }));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.parse(res.body).error, /attendance/);

  const res2 = await handlePostRsvp(JSON.stringify({ name: '山田太郎', attendance: 'maybe' }));
  assert.equal(res2.statusCode, 400);
});

test('POST /rsvp — rejects message over 500 chars', async () => {
  const res = await handlePostRsvp(JSON.stringify({
    name: '山田太郎',
    attendance: 'attending',
    message: 'a'.repeat(501),
  }));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.parse(res.body).error, /500文字以内/);
});

test('POST /rsvp — succeeds without dietary_restrictions (allergy field removed from guest form)', async () => {
  let putItem;
  await withMockSend(async (cmd) => {
    putItem = cmd.input.Item;
    return {};
  }, async () => {
    const res = await handlePostRsvp(JSON.stringify({
      name: '山田 太郎',
      attendance: 'attending',
      message: 'おめでとう',
    }));
    assert.equal(res.statusCode, 200);
    assert.match(JSON.parse(res.body).message, /受け付けました/);
    assert.equal(putItem.name, '山田 太郎');
    assert.equal(putItem.attendance, 'attending');
    assert.equal(putItem.message, 'おめでとう');
    assert.equal('dietary_restrictions' in putItem, false);
  });
});

test('POST /rsvp — still accepts dietary_restrictions for backward compatibility if sent', async () => {
  let putItem;
  await withMockSend(async (cmd) => {
    putItem = cmd.input.Item;
    return {};
  }, async () => {
    const res = await handlePostRsvp(JSON.stringify({
      name: '山田 太郎',
      attendance: 'not_attending',
      dietary_restrictions: '甲殻類アレルギー',
    }));
    assert.equal(res.statusCode, 200);
    assert.equal(putItem.dietary_restrictions, '甲殻類アレルギー');
  });
});

test('POST /rsvp — rejects dietary_restrictions over 200 chars when present', async () => {
  const res = await handlePostRsvp(JSON.stringify({
    name: '山田太郎',
    attendance: 'attending',
    dietary_restrictions: 'a'.repeat(201),
  }));
  assert.equal(res.statusCode, 400);
  assert.match(JSON.parse(res.body).error, /200文字以内/);
});

test('POST /rsvp — returns 500 on DynamoDB failure', async () => {
  await withMockSend(async () => { throw new Error('boom'); }, async () => {
    const res = await handlePostRsvp(JSON.stringify({ name: '山田太郎', attendance: 'attending' }));
    assert.equal(res.statusCode, 500);
  });
});
