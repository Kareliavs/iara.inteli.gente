const crypto = require("crypto");
const { pool } = require("../config/db");
const { validateStagedVariableRows } = require("../services/formularioService");

function repositoryError(message, status = 500, details) {
  const error = new Error(message);
  error.status = status;
  if (details) error.details = details;
  return error;
}

async function validateVariableCatalog(client, variableRows) {
  const signatures = [...new Set(variableRows.map((row) => row.variavelSigla))];
  const result = await client.query(
    `SELECT variavel_sigla
     FROM bd.variavel
     WHERE variavel_sigla = ANY($1::varchar[])`,
    [signatures],
  );
  const existing = new Set(result.rows.map((row) => row.variavel_sigla));
  const missing = signatures.filter((signature) => !existing.has(signature));

  if (missing.length > 0) {
    throw repositoryError("Existem variáveis do formulário ausentes no catálogo", 422, {
      variaveis_ausentes: missing,
    });
  }
}

async function promoteStagedVariables(client, submission) {
  const rowsResult = await client.query(
    `SELECT municipio_cod_ibge, ano, variavel_sigla,
            variavel_valor, variavel_valor_textual
     FROM stg.municipio_apresenta_variavel
     WHERE submissao_id = $1`,
    [submission.submissao_id],
  );
  if (rowsResult.rows.length === 0) {
    throw repositoryError("A submissão não possui variáveis para promover", 422);
  }

  if (
    rowsResult.rows.some(
      (row) =>
        Number(row.municipio_cod_ibge) !== Number(submission.municipio_cod_ibge) ||
        Number(row.ano) !== Number(submission.ano),
    )
  ) {
    throw repositoryError("A staging contém dados incompatíveis com a submissão", 422);
  }

  validateStagedVariableRows(rowsResult.rows);
  await validateVariableCatalog(
    client,
    rowsResult.rows.map((row) => ({ variavelSigla: row.variavel_sigla })),
  );

  await client.query(
    `INSERT INTO bd.municipio_apresenta_variavel
       (municipio_cod_ibge, variavel_sigla, ano,
        variavel_valor, variavel_valor_textual)
     SELECT municipio_cod_ibge, variavel_sigla, ano,
            COALESCE(variavel_valor, 0), variavel_valor_textual
     FROM stg.municipio_apresenta_variavel
     WHERE submissao_id = $1
     ON CONFLICT (municipio_cod_ibge, variavel_sigla, ano)
     DO UPDATE SET
       variavel_valor = EXCLUDED.variavel_valor,
       variavel_valor_textual = EXCLUDED.variavel_valor_textual`,
    [submission.submissao_id],
  );
}

async function criarSubmissao({ usuarioId, municipioCodIbge, ano, variableRows }) {
  const client = await pool.connect();
  const submissionId = crypto.randomUUID();

  try {
    await client.query("BEGIN");
    await validateVariableCatalog(client, variableRows);

    await client.query(
      `INSERT INTO stg.formulario_submissao
         (submissao_id, usuario_id, municipio_cod_ibge, ano, status)
       VALUES ($1, $2, $3, $4, 'PENDENTE')`,
      [submissionId, usuarioId, municipioCodIbge, ano],
    );

    await client.query(
      `INSERT INTO stg.municipio_apresenta_variavel
         (municipio_cod_ibge, variavel_sigla, ano, variavel_valor,
          variavel_valor_textual, submissao_id)
       SELECT $1, item.variavel_sigla, $2, item.variavel_valor,
              item.variavel_valor_textual, $3
       FROM jsonb_to_recordset($4::jsonb) AS item(
         variavel_sigla varchar,
         variavel_valor numeric,
         variavel_valor_textual varchar
       )`,
      [
        municipioCodIbge,
        ano,
        submissionId,
        JSON.stringify(
          variableRows.map((row) => ({
            variavel_sigla: row.variavelSigla,
            variavel_valor: row.variavelValor,
            variavel_valor_textual: row.variavelValorTextual,
          })),
        ),
      ],
    );

    await client.query("COMMIT");
    return {
      submissao_id: submissionId,
      status: "PENDENTE",
      municipio_cod_ibge: municipioCodIbge,
      ano,
      variaveis_total: variableRows.length,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    if (
      error.code === "23505" &&
      error.constraint === "formulario_submissao_pendente_municipio_ano_uidx"
    ) {
      throw repositoryError(
        "Já existe um formulário deste município e ano aguardando validação",
        409,
      );
    }
    throw error;
  } finally {
    client.release();
  }
}

async function listarSubmissoes(status = "PENDENTE") {
  const result = await pool.query(
    `SELECT s.submissao_id, s.usuario_id, u.usuario_nome, u.usuario_login,
            s.municipio_cod_ibge, m.municipio_nome, m.estado_sigla,
            s.ano, s.status, s.enviado_em, s.validado_em,
            s.validado_por, s.motivo_rejeicao,
            COUNT(v.*)::int AS variaveis_total
     FROM stg.formulario_submissao s
     JOIN bd.usuario u ON u.usuario_id = s.usuario_id
     JOIN bd.municipio m ON m.municipio_cod_ibge = s.municipio_cod_ibge
     LEFT JOIN stg.municipio_apresenta_variavel v
       ON v.submissao_id = s.submissao_id
     WHERE s.status = $1
     GROUP BY s.submissao_id, u.usuario_nome, u.usuario_login,
              m.municipio_nome, m.estado_sigla
     ORDER BY s.enviado_em ASC`,
    [status],
  );
  return result.rows;
}

async function buscarSubmissaoDetalhada(submissionId) {
  const submissionResult = await pool.query(
    `SELECT s.submissao_id, s.usuario_id, u.usuario_nome, u.usuario_login,
            s.municipio_cod_ibge, m.municipio_nome, m.estado_sigla,
            s.ano, s.status, s.enviado_em, s.validado_em,
            s.validado_por, s.motivo_rejeicao
     FROM stg.formulario_submissao s
     JOIN bd.usuario u ON u.usuario_id = s.usuario_id
     JOIN bd.municipio m ON m.municipio_cod_ibge = s.municipio_cod_ibge
     WHERE s.submissao_id = $1`,
    [submissionId],
  );
  const submission = submissionResult.rows[0];
  if (!submission) throw repositoryError("Submissão não encontrada", 404);

  const variablesResult = await pool.query(
    `SELECT variavel_sigla, variavel_valor, variavel_valor_textual
     FROM stg.municipio_apresenta_variavel
     WHERE submissao_id = $1
     ORDER BY variavel_sigla`,
    [submissionId],
  );
  return { ...submission, variaveis: variablesResult.rows };
}

async function buscarSubmissaoAtualMunicipio(municipioCodIbge, ano) {
  const submissionResult = await pool.query(
    `SELECT s.submissao_id, s.usuario_id, u.usuario_nome, u.usuario_login,
            s.municipio_cod_ibge, m.municipio_nome, m.estado_sigla,
            s.ano, s.status, s.enviado_em, s.validado_em,
            s.validado_por, s.motivo_rejeicao
     FROM stg.formulario_submissao s
     JOIN bd.usuario u ON u.usuario_id = s.usuario_id
     JOIN bd.municipio m ON m.municipio_cod_ibge = s.municipio_cod_ibge
     WHERE s.municipio_cod_ibge = $1 AND s.ano = $2
     ORDER BY s.enviado_em DESC, s.submissao_id DESC
     LIMIT 1`,
    [municipioCodIbge, ano],
  );
  const submission = submissionResult.rows[0];
  if (!submission) return null;

  const variablesResult = await pool.query(
    `SELECT variavel_sigla, variavel_valor, variavel_valor_textual
     FROM stg.municipio_apresenta_variavel
     WHERE submissao_id = $1
     ORDER BY variavel_sigla`,
    [submission.submissao_id],
  );
  return { ...submission, variaveis: variablesResult.rows };
}

async function aprovarSubmissao({ submissionId, validatorId }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT submissao_id, municipio_cod_ibge, ano, status
       FROM stg.formulario_submissao
       WHERE submissao_id = $1
       FOR UPDATE`,
      [submissionId],
    );
    const submission = result.rows[0];
    if (!submission) throw repositoryError("Submissão não encontrada", 404);
    if (submission.status !== "PENDENTE") {
      throw repositoryError("A submissão já foi validada", 409);
    }

    await promoteStagedVariables(client, submission);
    const updateResult = await client.query(
      `UPDATE stg.formulario_submissao
       SET status = 'APROVADA', validado_em = NOW(),
           validado_por = $2, motivo_rejeicao = NULL
       WHERE submissao_id = $1
       RETURNING submissao_id, municipio_cod_ibge, ano, status,
                 validado_em, validado_por`,
      [submissionId, validatorId],
    );
    await client.query("COMMIT");
    return updateResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function rejeitarSubmissao({ motivo, submissionId, validatorId }) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `SELECT status
       FROM stg.formulario_submissao
       WHERE submissao_id = $1
       FOR UPDATE`,
      [submissionId],
    );
    const submission = result.rows[0];
    if (!submission) throw repositoryError("Submissão não encontrada", 404);
    if (submission.status !== "PENDENTE") {
      throw repositoryError("A submissão já foi validada", 409);
    }

    const updateResult = await client.query(
      `UPDATE stg.formulario_submissao
       SET status = 'REJEITADA', validado_em = NOW(),
           validado_por = $2, motivo_rejeicao = $3
       WHERE submissao_id = $1
       RETURNING submissao_id, municipio_cod_ibge, ano, status,
                 validado_em, validado_por, motivo_rejeicao`,
      [submissionId, validatorId, motivo],
    );
    await client.query("COMMIT");
    return updateResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  aprovarSubmissao,
  buscarSubmissaoDetalhada,
  buscarSubmissaoAtualMunicipio,
  criarSubmissao,
  listarSubmissoes,
  rejeitarSubmissao,
};
