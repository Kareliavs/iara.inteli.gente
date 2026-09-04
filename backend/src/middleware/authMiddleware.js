const { buscarSessaoAtiva } = require("../repositories/usuariosRepository");
const { hashEmailConfirmationToken, verifyAuthToken } = require("../services/authService");
const { getSessionToken } = require("../services/sessionService");

async function requireAuth(req, res, next) {
  const token = getSessionToken(req);
  try {
    const payload = verifyAuthToken(token);
    if (!payload) {
      return res.status(401).json({ error: "Sessão inválida ou expirada" });
    }

    const usuario = await buscarSessaoAtiva(
      hashEmailConfirmationToken(token),
      Number(payload.sub),
    );
    if (!usuario) {
      return res.status(401).json({ error: "Sessão revogada ou expirada" });
    }

    req.usuario = {
      ...usuario,
      usuario_id: Number(usuario.usuario_id),
      municipio_cod_ibge:
        usuario.municipio_cod_ibge == null ? null : Number(usuario.municipio_cod_ibge),
    };
    return next();
  } catch (error) {
    console.error("Erro ao validar sessão:", error);
    return res.status(error.status || 500).json({
      error: error.status ? error.message : "Erro ao validar sessão",
    });
  }
}

function normalizeRole(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function requireAdmin(req, res, next) {
  if (normalizeRole(req.usuario?.usuario_funcao) !== "admin") {
    return res.status(403).json({ error: "Acesso permitido somente a administradores" });
  }
  return next();
}

module.exports = { requireAdmin, requireAuth };
