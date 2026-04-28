const { timingSafeEqual } = require('crypto');

function verifyPassword(input, expected) {
  if (!input || !expected) return false;
  try {
    const a = Buffer.from(input);
    const b = Buffer.from(expected);
    if (a.length !== b.length) {
      timingSafeEqual(a, Buffer.alloc(a.length));
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function extractBearerToken(headers) {
  const authHeader = headers?.authorization || headers?.Authorization || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
}

module.exports = { verifyPassword, extractBearerToken };
