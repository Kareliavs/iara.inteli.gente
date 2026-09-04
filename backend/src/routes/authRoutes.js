const express = require("express");
const {
  confirmPasswordReset,
  confirmRegistration,
  currentSession,
  login,
  logout,
  register,
  requestPasswordReset,
  resendRegistrationConfirmation,
} = require("../controllers/authController");
const { requireAuth } = require("../middleware/authMiddleware");
const { createRateLimiter } = require("../middleware/rateLimitMiddleware");

const router = express.Router();
const minutes = (value) => value * 60 * 1000;

router.use("/auth", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  next();
});

router.post(
  "/auth/login",
  createRateLimiter({ keyPrefix: "login", max: 10, windowMs: minutes(15) }),
  login,
);
router.post(
  "/auth/register",
  createRateLimiter({ keyPrefix: "register", max: 5, windowMs: minutes(60) }),
  register,
);
router.post(
  "/auth/register/confirm",
  createRateLimiter({ keyPrefix: "register-confirm", max: 10, windowMs: minutes(15) }),
  confirmRegistration,
);
router.post(
  "/auth/register/resend",
  createRateLimiter({ keyPrefix: "register-resend", max: 3, windowMs: minutes(60) }),
  resendRegistrationConfirmation,
);
router.post(
  "/auth/password/forgot",
  createRateLimiter({ keyPrefix: "password-forgot", max: 3, windowMs: minutes(60) }),
  requestPasswordReset,
);
router.post(
  "/auth/password/reset",
  createRateLimiter({ keyPrefix: "password-reset", max: 10, windowMs: minutes(15) }),
  confirmPasswordReset,
);
router.get("/auth/session", requireAuth, currentSession);
router.post("/auth/logout", logout);

module.exports = router;
