const RESPONSE_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
};

const response = (statusCode, body) => ({
  statusCode,
  headers: RESPONSE_HEADERS,
  body: JSON.stringify(body),
});

module.exports = { response, RESPONSE_HEADERS };
