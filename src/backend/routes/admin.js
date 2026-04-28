const { ScanCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const { docClient } = require('../lib/db');
const { response } = require('../lib/response');
const { verifyPassword, extractBearerToken } = require('../lib/auth');

const TABLE_NAME = process.env.DYNAMODB_TABLE;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function handleGetAdminRsvp(headers) {
  const token = extractBearerToken(headers);
  if (!verifyPassword(token, ADMIN_PASSWORD)) {
    return response(401, { error: '認証に失敗しました。' });
  }

  try {
    const result = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
    const items = (result.Items || []).sort(
      (a, b) => new Date(b.submitted_at) - new Date(a.submitted_at)
    );
    return response(200, { items, count: items.length });
  } catch (err) {
    console.error('ScanCommand error:', err);
    return response(500, { error: 'サーバーエラーが発生しました。' });
  }
}

async function handleDeleteAdminRsvp(headers, id) {
  const token = extractBearerToken(headers);
  if (!verifyPassword(token, ADMIN_PASSWORD)) {
    return response(401, { error: '認証に失敗しました。' });
  }

  const trimmedId = id ? id.trim() : '';
  if (!trimmedId) {
    return response(400, { error: 'id は必須です。' });
  }

  try {
    await docClient.send(new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id: trimmedId },
    }));
    return response(200, { message: '回答を削除しました。' });
  } catch (err) {
    console.error('DeleteCommand error:', err);
    return response(500, { error: 'サーバーエラーが発生しました。' });
  }
}

module.exports = { handleGetAdminRsvp, handleDeleteAdminRsvp };
