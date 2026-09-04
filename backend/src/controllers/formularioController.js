const {
  aprovarSubmissao,
  buscarSubmissaoDetalhada,
  buscarSubmissaoAtualMunicipio,
  criarSubmissao,
  listarSubmissoes,
  rejeitarSubmissao,
} = require("../repositories/formularioRepository");
const {
  buildAnswersFromStagedVariableRows,
  buildVariableRows,
} = require("../services/formularioService");

function handleError(res, error, message, label) {
  if (error.status) {
    return res.status(error.status).json({
      error: error.message,
      ...(error.details || {}),
    });
  }
  console.error(label, error);
  return res.status(500).json({ error: message });
}

async function submitFormulario(req, res) {
  try {
    if (!req.usuario.municipio_cod_ibge) {
      return res.status(403).json({ error: "Usuário sem município associado" });
    }

    const ano = new Date().getFullYear();
    const variableRows = buildVariableRows(req.body?.respostas);
    const submission = await criarSubmissao({
      usuarioId: req.usuario.usuario_id,
      municipioCodIbge: req.usuario.municipio_cod_ibge,
      ano,
      variableRows,
    });
    return res.status(201).json(submission);
  } catch (error) {
    return handleError(
      res,
      error,
      "Erro ao processar formulário",
      "Erro ao criar submissão do formulário:",
    );
  }
}

async function getSubmissaoAtual(req, res) {
  try {
    if (!req.usuario.municipio_cod_ibge) {
      return res.status(403).json({ error: "Usuário sem município associado" });
    }
    const ano = new Date().getFullYear();
    const submission = await buscarSubmissaoAtualMunicipio(
      req.usuario.municipio_cod_ibge,
      ano,
    );
    if (!submission) {
      return res.json({ ano, status: "NAO_PREENCHIDO", respostas: [] });
    }
    return res.json({
      ...submission,
      respostas: buildAnswersFromStagedVariableRows(submission.variaveis),
      variaveis: undefined,
    });
  } catch (error) {
    return handleError(
      res,
      error,
      "Erro ao consultar o formulário anual",
      "Erro ao consultar o formulário anual do município:",
    );
  }
}

async function getSubmissoes(req, res) {
  const status = String(req.query.status || "PENDENTE").trim().toUpperCase();
  if (!new Set(["PENDENTE", "APROVADA", "REJEITADA"]).has(status)) {
    return res.status(400).json({ error: "Status de submissão inválido" });
  }

  try {
    return res.json({ status, submissoes: await listarSubmissoes(status) });
  } catch (error) {
    return handleError(
      res,
      error,
      "Erro ao listar submissões",
      "Erro ao listar submissões do formulário:",
    );
  }
}

function getSubmissionId(req) {
  const submissionId = String(req.params.submissaoId || "").trim().toLowerCase();
  if (!/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(submissionId)) {
    const error = new Error("Identificador de submissão inválido");
    error.status = 400;
    throw error;
  }
  return submissionId;
}

async function getSubmissao(req, res) {
  try {
    return res.json(await buscarSubmissaoDetalhada(getSubmissionId(req)));
  } catch (error) {
    return handleError(
      res,
      error,
      "Erro ao consultar submissão",
      "Erro ao consultar submissão do formulário:",
    );
  }
}

async function approveSubmissao(req, res) {
  try {
    const submission = await aprovarSubmissao({
      submissionId: getSubmissionId(req),
      validatorId: req.usuario.usuario_id,
    });
    return res.json(submission);
  } catch (error) {
    return handleError(
      res,
      error,
      "Erro ao aprovar submissão",
      "Erro ao aprovar submissão do formulário:",
    );
  }
}

async function rejectSubmissao(req, res) {
  try {
    const motivo = String(req.body?.motivo || "").trim();
    if (motivo.length < 3 || motivo.length > 1000) {
      const error = new Error("Informe um motivo entre 3 e 1000 caracteres");
      error.status = 400;
      throw error;
    }
    const submission = await rejeitarSubmissao({
      motivo,
      submissionId: getSubmissionId(req),
      validatorId: req.usuario.usuario_id,
    });
    return res.json(submission);
  } catch (error) {
    return handleError(
      res,
      error,
      "Erro ao rejeitar submissão",
      "Erro ao rejeitar submissão do formulário:",
    );
  }
}

module.exports = {
  approveSubmissao,
  getSubmissoes,
  getSubmissao,
  getSubmissaoAtual,
  rejectSubmissao,
  submitFormulario,
};
