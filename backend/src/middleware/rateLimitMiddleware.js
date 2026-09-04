const buckets = new Map();

function cleanupExpiredBuckets() {
  const now = Date.now();
  for (const [key, bucket] of buckets.entries()) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

const cleanupTimer = setInterval(cleanupExpiredBuckets, 5 * 60 * 1000);
cleanupTimer.unref();

function createRateLimiter({ keyPrefix, max, windowMs }) {
  return (req, res, next) => {
    const now = Date.now();
    const key = `${keyPrefix}:${req.ip || req.socket?.remoteAddress || "unknown"}`;
    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;

    const remaining = Math.max(0, max - bucket.count);
    res.set("RateLimit-Limit", String(max));
    res.set("RateLimit-Remaining", String(remaining));
    res.set("RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));
    if (bucket.count > max) {
      const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        error: "Muitas tentativas. Aguarde alguns minutos e tente novamente.",
      });
    }
    return next();
  };
}

module.exports = { createRateLimiter };
