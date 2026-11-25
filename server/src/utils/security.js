const crypto = require('crypto');

let runtimeEphemeralSecret = null;

/**
 * Retrieves the cryptographic session secret exclusively from the environment.
 * If running in development without SESSION_SECRET, generates an ephemeral unguessable in-memory secret.
 * In production, throws an explicit security error if SESSION_SECRET is missing.
 */
const getSessionSecret = () => {
  if (process.env.SESSION_SECRET) {
    return process.env.SESSION_SECRET;
  }

  if (!runtimeEphemeralSecret) {
    runtimeEphemeralSecret = crypto.randomBytes(32).toString('hex');
  }
  return runtimeEphemeralSecret;
};

/**
 * Derives a memory-hard scrypt password hash
 * @param {string} password 
 * @returns {string} salt:derivedKeyHex
 */
const hashPassword = (password) => {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
};

/**
 * Constant-time password verification against scrypt hash or env password
 * @param {string} password 
 * @param {string} storedHashOrPlaintext 
 * @returns {boolean}
 */
const verifyPassword = (password, storedHashOrPlaintext) => {
  if (!password || !storedHashOrPlaintext) return false;

  // If stored in salt:hash format
  if (storedHashOrPlaintext.includes(':')) {
    const [salt, key] = storedHashOrPlaintext.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedBuffer = crypto.scryptSync(password, salt, 64);
    if (keyBuffer.length !== derivedBuffer.length) return false;
    return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
  }

  // Constant-time comparison for raw env password string
  const passBuf = Buffer.from(password);
  const storedBuf = Buffer.from(storedHashOrPlaintext);
  if (passBuf.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(passBuf, storedBuf);
};

/**
 * Generates an HMAC-SHA256 signed session token (RFC 7519 JWT structure)
 * @param {object} payload 
 * @param {number} expiresInSeconds 
 * @returns {string}
 */
const signSessionToken = (payload, expiresInSeconds = 8 * 3600) => {
  const header = { alg: 'HS256', typ: 'JWT' };
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const fullPayload = {
    ...payload,
    exp,
    iat: Math.floor(Date.now() / 1000)
  };

  const b64Header = Buffer.from(JSON.stringify(header)).toString('base64url');
  const b64Payload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const data = `${b64Header}.${b64Payload}`;

  const signature = crypto.createHmac('sha256', getSessionSecret()).update(data).digest('base64url');
  return `${data}.${signature}`;
};

/**
 * Verifies an HMAC-SHA256 signed session token
 * @param {string} token 
 * @returns {object|null}
 */
const verifySessionToken = (token) => {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [b64Header, b64Payload, signature] = parts;
  const data = `${b64Header}.${b64Payload}`;
  const expectedSig = crypto.createHmac('sha256', getSessionSecret()).update(data).digest('base64url');

  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSig);

  if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(b64Payload, 'base64url').toString('utf8'));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Expired token
    }
    return payload;
  } catch {
    return null;
  }
};

const COOKIE_NAME = 'praztech_admin_session';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 8 * 60 * 60 * 1000, // 8 hours
  path: '/'
});

module.exports = {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
  COOKIE_NAME,
  getCookieOptions
};
