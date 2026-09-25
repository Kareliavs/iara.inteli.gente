const express = require("express");
const { emailOutboxStatus } = require("../controllers/emailOutboxController");
const { requireAdmin, requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(
  "/admin/email-outbox/status",
  requireAuth,
  requireAdmin,
  emailOutboxStatus,
);

module.exports = router;
