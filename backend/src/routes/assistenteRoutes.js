const express = require("express");
const { perguntar } = require("../controllers/assistenteController");
const { createRateLimiter } = require("../middleware/rateLimitMiddleware");

const router = express.Router();

function positiveIntegerOrDefault(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const rateLimiter = createRateLimiter({
  keyPrefix: "assistente-perguntar",
  max: positiveIntegerOrDefault(process.env.AI_RATE_LIMIT_MAX, 10),
  windowMs: positiveIntegerOrDefault(process.env.AI_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
});

router.use("/assistente", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

router.post("/assistente/perguntar", rateLimiter, perguntar);

module.exports = router;
