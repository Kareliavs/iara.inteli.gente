const {
  atualizarSenhaUsuario,
  buscarUsuarioPorLogin,
  confirmarCadastro,
  confirmarRedefinicaoSenha,
  criarCadastroPendente,
  criarRedefinicaoSenha,
  criarSessao,
  registrarEventoAutenticacao,
  removerCadastroPendente,
  renovarCadastroPendente,
  revogarSessao,
} = require("../repositories/usuariosRepository");
const {
  createEmailConfirmationToken,
  hashEmailConfirmationToken,
  hashPassword,
  needsPasswordRehash,
  signAuthToken,
  validateInstitutionalEmail,
  validateNewPassword,
  validateRegistrationInput,
  verifyPassword,
} = require("../services/authService");
const {
  sendAccountConfirmationEmail,
  sendPasswordResetEmail,
} = require("../services/emailService");
const {
  clearSessionCookie,
  getSessionToken,
  getSessionTtlSeconds,
  setSessionCookie,
} = require("../services/sessionService");

function serializeUser(usuario) {
  return {
    usuario_id: Number(usuario.usuario_id),
    usuario_nome: usuario.usuario_nome || null,
    usuario_login: usuario.usuario_login,
    usuario_funcao: usuario.usuario_funcao || null,
    municipio_cod_ibge:
      usuario.municipio_cod_ibge == null ? null : Number(usuario.municipio_cod_ibge),
  };
}

function eventMetadata(req, overrides = {}) {
  return {
    enderecoIp: req.ip || req.socket?.remoteAddress || null,
    userAgent: req.headers["user-agent"] || null,
    ...overrides,
  };
}

async function establishSession(res, usuario, rememberAccess = false) {
  const ttlSeconds = getSessionTtlSeconds(rememberAccess);
  const token = signAuthToken(usuario.usuario_id, ttlSeconds);
  await criarSessao({
    tokenHash: hashEmailConfirmationToken(token),
    ttlSeconds,
    usuarioId: usuario.usuario_id,
  });
  setSessionCookie(res, token, ttlSeconds);
}

function handleAuthError(res, error, fallbackMessage, logLabel) {
  if (error.status) {
    return res.status(error.status).json({ error: error.message });
  }
  console.error(logLabel, error);
  return res.status(500).json({ error: fallbackMessage });
}

async function login(req, res) {
  const usuarioLogin = String(req.body?.login || "").trim().toLowerCase();
  const senha = String(req.body?.senha || "");
  if (!usuarioLogin || !senha) {
    return res.status(400).json({ error: "Login e senha são obrigatórios" });
  }

  try {
    const usuario = await buscarUsuarioPorLogin(usuarioLogin);
    const passwordMatches = await verifyPassword(senha, usuario?.usuario_senha);
    if (!usuario || !passwordMatches) {
      await registrarEventoAutenticacao(
        eventMetadata(req, { eventoTipo: "LOGIN_FALHOU", usuarioLogin }),
      );
      return res.status(401).json({ error: "Credenciais inválidas" });
    }
    if (usuario.usuario_funcao === "prefeitura" && !usuario.municipio_cod_ibge) {
      return res.status(403).json({ error: "Usuário sem município associado" });
    }

    if (needsPasswordRehash(usuario.usuario_senha)) {
      try {
        await atualizarSenhaUsuario(usuario.usuario_id, await hashPassword(senha));
      } catch (error) {
        console.error("Erro ao atualizar parâmetros do hash de senha:", error);
      }
    }

    await establishSession(res, usuario, Boolean(req.body?.lembrar));
    await registrarEventoAutenticacao(
      eventMetadata(req, {
        eventoTipo: "LOGIN_SUCESSO",
        usuarioId: usuario.usuario_id,
        usuarioLogin,
      }),
    );
    return res.json({ usuario: serializeUser(usuario) });
  } catch (error) {
    return handleAuthError(res, error, "Erro ao autenticar usuário", "Erro ao autenticar usuário:");
  }
}

async function register(req, res) {
  try {
    const input = validateRegistrationInput({
      nome: req.body?.nome,
      login: req.body?.email,
      senha: req.body?.senha,
    });
    const confirmationToken = createEmailConfirmationToken();
    const pending = await criarCadastroPendente({
      estadoSigla: input.estadoSigla,
      municipioDominio: input.municipioDominio,
      tokenHash: hashEmailConfirmationToken(confirmationToken),
      usuarioLogin: input.usuarioLogin,
      usuarioNome: input.usuarioNome,
      usuarioSenha: await hashPassword(input.senha),
    });

    try {
      await sendAccountConfirmationEmail({
        email: input.usuarioLogin,
        name: input.usuarioNome,
        token: confirmationToken,
      });
    } catch (error) {
      await removerCadastroPendente(pending.cadastroId);
      throw error;
    }

    await registrarEventoAutenticacao(
      eventMetadata(req, {
        eventoTipo: "CADASTRO_SOLICITADO",
        usuarioLogin: input.usuarioLogin,
      }),
    );
    return res.status(202).json({
      email: input.usuarioLogin,
      message: "Enviamos um link de confirmação para o seu e-mail",
      municipio: `${pending.municipio_nome} - ${pending.estado_sigla}`,
    });
  } catch (error) {
    return handleAuthError(res, error, "Erro ao criar conta", "Erro ao criar conta:");
  }
}

async function resendRegistrationConfirmation(req, res) {
  try {
    const { usuarioLogin } = validateInstitutionalEmail(req.body?.email);
    const confirmationToken = createEmailConfirmationToken();
    const pending = await renovarCadastroPendente(
      usuarioLogin,
      hashEmailConfirmationToken(confirmationToken),
    );
    await registrarEventoAutenticacao(
      eventMetadata(req, {
        eventoTipo: "CADASTRO_CONFIRMACAO_REENVIO_SOLICITADO",
        usuarioLogin,
      }),
    );
    if (pending) {
      await sendAccountConfirmationEmail({
        email: pending.usuario_login,
        name: pending.usuario_nome,
        token: confirmationToken,
      });
    }
    return res.status(202).json({
      message: "Se houver um cadastro pendente, um novo link será enviado",
    });
  } catch (error) {
    return handleAuthError(res, error, "Erro ao reenviar confirmação", "Erro ao reenviar confirmação:");
  }
}

async function confirmRegistration(req, res) {
  const token = String(req.body?.token || "").trim();
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return res.status(400).json({ error: "Link de confirmação inválido" });
  }

  try {
    const usuario = await confirmarCadastro(hashEmailConfirmationToken(token));
    await establishSession(res, usuario);
    await registrarEventoAutenticacao(
      eventMetadata(req, {
        eventoTipo: "CADASTRO_CONFIRMADO",
        usuarioId: usuario.usuario_id,
        usuarioLogin: usuario.usuario_login,
      }),
    );
    return res.json({ usuario: serializeUser(usuario) });
  } catch (error) {
    return handleAuthError(res, error, "Erro ao confirmar conta", "Erro ao confirmar conta:");
  }
}

async function requestPasswordReset(req, res) {
  try {
    const { usuarioLogin } = validateInstitutionalEmail(req.body?.email);
    const resetToken = createEmailConfirmationToken();
    const usuario = await criarRedefinicaoSenha(
      usuarioLogin,
      hashEmailConfirmationToken(resetToken),
    );
    await registrarEventoAutenticacao(
      eventMetadata(req, {
        eventoTipo: "SENHA_REDEFINICAO_SOLICITADA",
        usuarioId: usuario?.usuario_id,
        usuarioLogin,
      }),
    );
    if (usuario) {
      await sendPasswordResetEmail({
        email: usuario.usuario_login,
        name: usuario.usuario_nome || "usuário",
        token: resetToken,
      });
    }
    return res.status(202).json({
      message: "Se o e-mail estiver cadastrado, enviaremos as instruções de redefinição",
    });
  } catch (error) {
    return handleAuthError(res, error, "Erro ao solicitar redefinição", "Erro ao solicitar redefinição:");
  }
}

async function confirmPasswordReset(req, res) {
  const token = String(req.body?.token || "").trim();
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) {
    return res.status(400).json({ error: "Link de redefinição inválido" });
  }
  try {
    const senha = validateNewPassword(req.body?.senha);
    const usuarioId = await confirmarRedefinicaoSenha(
      hashEmailConfirmationToken(token),
      await hashPassword(senha),
    );
    await registrarEventoAutenticacao(
      eventMetadata(req, { eventoTipo: "SENHA_REDEFINIDA", usuarioId }),
    );
    return res.json({ message: "Senha redefinida com sucesso" });
  } catch (error) {
    return handleAuthError(res, error, "Erro ao redefinir senha", "Erro ao redefinir senha:");
  }
}

function currentSession(req, res) {
  return res.json({ usuario: serializeUser(req.usuario) });
}

async function logout(req, res) {
  const token = getSessionToken(req);
  try {
    if (token) {
      await revogarSessao(hashEmailConfirmationToken(token));
    }
    await registrarEventoAutenticacao(
      eventMetadata(req, { eventoTipo: "LOGOUT" }),
    );
  } catch (error) {
    console.error("Erro ao encerrar sessão:", error);
  } finally {
    clearSessionCookie(res);
  }
  return res.status(204).end();
}

module.exports = {
  confirmPasswordReset,
  confirmRegistration,
  currentSession,
  login,
  logout,
  register,
  requestPasswordReset,
  resendRegistrationConfirmation,
};
