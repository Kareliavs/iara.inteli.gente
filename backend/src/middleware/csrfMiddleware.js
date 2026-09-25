const { getSessionToken } = require("../services/sessionService");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function normalizeOrigin(value) {
  try {
    return new URL(String(value || "")).origin;
  } catch {
    return null;
  }
}

function requestOrigin(req) {
  const origin = normalizeOrigin(req.headers.origin);
  if (origin) return origin;
  return normalizeOrigin(req.headers.referer);
}

function createCsrfProtection(allowedOrigins) {
  const trustedOrigins = new Set(
    allowedOrigins.map(normalizeOrigin).filter(Boolean),
  );

  return (req, res, next) => {
    if (SAFE_METHODS.has(req.method) || !getSessionToken(req)) return next();

    const origin = requestOrigin(req);
    if (!origin || !trustedOrigins.has(origin)) {
      return res.status(403).json({
        error: "Origem da requisição não autorizada",
      });
    }
    return next();
  };
}

module.exports = { createCsrfProtection, normalizeOrigin, requestOrigin };
