const { RESPONSE_HEADERS, response } = require('./lib/response');
const { handlePostRsvp } = require('./routes/rsvp');
const { handleGetAdminRsvp, handleDeleteAdminRsvp } = require('./routes/admin');

exports.handler = async (event) => {
  const method = event.requestContext?.http?.method || event.httpMethod;
  const path = event.rawPath || event.path;
  const headers = event.headers || {};

  let rawBody = event.body || null;
  if (event.isBase64Encoded && rawBody) {
    rawBody = Buffer.from(rawBody, 'base64').toString('utf8');
  }

  if (method === 'OPTIONS') {
    return { statusCode: 200, headers: RESPONSE_HEADERS, body: '' };
  }

  if (method === 'POST' && path === '/api/rsvp') {
    return await handlePostRsvp(rawBody);
  }

  if (method === 'GET' && path === '/api/admin/rsvp') {
    return await handleGetAdminRsvp(headers);
  }

  if (method === 'DELETE' && path.startsWith('/api/admin/rsvp/')) {
    const id = path.split('/api/admin/rsvp/')[1];
    return await handleDeleteAdminRsvp(headers, id);
  }

  return response(404, { error: 'Not Found' });
};
