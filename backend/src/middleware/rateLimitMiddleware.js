const { consumeRateLimit } = require("../repositories/rateLimitRepository");

function createRateLimiter({ keyPrefix, max, windowMs, consume = consumeRateLimit }) {
  return async (req, res, next) => {
    try {
      const identifier = req.ip || req.socket?.remoteAddress || "unknown";
      const bucket = await consume({ key: `${keyPrefix}:${identifier}`, windowMs });
      const remaining = Math.max(0, max - bucket.count);
      res.set("RateLimit-Limit", String(max));
      res.set("RateLimit-Remaining", String(remaining));
      res.set("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));
      if (bucket.count > max) {
        const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - Date.now()) / 1000));
        res.set("Retry-After", String(retryAfter));
        return res.status(429).json({
          error: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
        });
      }
      return next();
    } catch (error) {
      console.error("Falha ao aplicar limite de requisições:", error.message);
      return res.status(503).json({
        error: "Serviço temporariamente indisponível. Tente novamente em alguns instantes.",
      });
    }
  };
}

module.exports = { createRateLimiter };
