const { clerkClient } = require('@clerk/clerk-sdk-node');

/**
 * requireAuth — verifies the Clerk session token from the Authorization header.
 * Attaches req.auth = { userId, sessionId } on success.
 */
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // Verify the session token with Clerk
    const { sub: userId, sid: sessionId } = await clerkClient.verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    req.auth = { userId, sessionId };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

/**
 * optionalAuth — same as requireAuth but doesn't block if no token.
 * Attaches req.auth if valid token present, otherwise req.auth = null.
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      req.auth = null;
      return next();
    }
    const token = authHeader.split(' ')[1];
    const { sub: userId, sid: sessionId } = await clerkClient.verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    req.auth = { userId, sessionId };
  } catch {
    req.auth = null;
  }
  next();
}

module.exports = { requireAuth, optionalAuth };
