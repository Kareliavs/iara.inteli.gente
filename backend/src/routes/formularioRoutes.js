const express = require("express");
const {
  approveSubmissao,
  getSubmissoes,
  getSubmissao,
  getSubmissaoAtual,
  rejectSubmissao,
  submitFormulario,
} = require("../controllers/formularioController");
const { requireAdmin, requireAuth } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/formularios/autodeclaracao", requireAuth, submitFormulario);
router.get(
  "/formularios/autodeclaracao/atual",
  requireAuth,
  getSubmissaoAtual,
);
router.get(
  "/formularios/autodeclaracao/submissoes",
  requireAuth,
  requireAdmin,
  getSubmissoes,
);
router.get(
  "/formularios/autodeclaracao/submissoes/:submissaoId",
  requireAuth,
  requireAdmin,
  getSubmissao,
);
router.patch(
  "/formularios/autodeclaracao/submissoes/:submissaoId/aprovar",
  requireAuth,
  requireAdmin,
  approveSubmissao,
);
router.patch(
  "/formularios/autodeclaracao/submissoes/:submissaoId/rejeitar",
  requireAuth,
  requireAdmin,
  rejectSubmissao,
);

module.exports = router;
