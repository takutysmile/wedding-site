const { PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');
const { docClient } = require('../lib/db');
const { response } = require('../lib/response');

const TABLE_NAME = process.env.DYNAMODB_TABLE;

async function handlePostRsvp(rawBody) {
  if (!rawBody) {
    return response(400, { error: 'リクエストボディが不正です。' });
  }

  let body;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return response(400, { error: 'リクエストボディが不正です。' });
  }

  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return response(400, { error: 'リクエストボディが不正です。' });
  }

  const { name, attendance, dietary_restrictions, message } = body;

  const trimmedName = typeof name === 'string' ? name.trim() : '';
  if (!trimmedName) {
    return response(400, { error: 'name は必須です。' });
  }
  if (trimmedName.length > 50) {
    return response(400, { error: 'name は50文字以内で入力してください。' });
  }
  if (!attendance || !['attending', 'not_attending'].includes(attendance)) {
    return response(400, { error: 'attendance は "attending" または "not_attending" を指定してください。' });
  }
  if (dietary_restrictions !== undefined) {
    if (typeof dietary_restrictions !== 'string') {
      return response(400, { error: 'dietary_restrictions は文字列で入力してください。' });
    }
    if (dietary_restrictions.length > 200) {
      return response(400, { error: 'dietary_restrictions は200文字以内で入力してください。' });
    }
  }
  if (message !== undefined) {
    if (typeof message !== 'string') {
      return response(400, { error: 'message は文字列で入力してください。' });
    }
    if (message.length > 500) {
      return response(400, { error: 'message は500文字以内で入力してください。' });
    }
  }

  const item = {
    id: randomUUID(),
    name: trimmedName,
    attendance,
    submitted_at: new Date().toISOString(),
  };
  if (dietary_restrictions) item.dietary_restrictions = dietary_restrictions.trim();
  if (message) item.message = message.trim();

  try {
    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));
    return response(200, { message: '回答を受け付けました。' });
  } catch (err) {
    console.error('PutCommand error:', err);
    return response(500, { error: 'サーバーエラーが発生しました。' });
  }
}

module.exports = { handlePostRsvp };
