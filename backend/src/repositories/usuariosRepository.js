const crypto = require("crypto");
const { pool } = require("../config/db");

function repositoryError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function buscarUsuarioPorLogin(login) {
  const result = await pool.query(
    `SELECT usuario_id, usuario_nome, usuario_login, usuario_senha,
            usuario_funcao, municipio_cod_ibge
     FROM bd.usuario
     WHERE LOWER(usuario_login) = LOWER($1)
     LIMIT 1`,
    [login],
  );
  return result.rows[0] || null;
}

async function buscarUsuarioPorId(usuarioId) {
  const result = await pool.query(
    `SELECT usuario_id, usuario_nome, usuario_login,
            usuario_funcao, municipio_cod_ibge
     FROM bd.usuario
     WHERE usuario_id = $1
     LIMIT 1`,
    [usuarioId],
  );
  return result.rows[0] || null;
}

async function atualizarSenhaUsuario(usuarioId, usuarioSenha) {
  await pool.query(
    "UPDATE bd.usuario SET usuario_senha = $2 WHERE usuario_id = $1",
    [usuarioId, usuarioSenha],
  );
}

async function buscarMunicipioPorDominio(client, municipioDominio, estadoSigla) {
  const result = await client.query(
    `SELECT municipio_cod_ibge, municipio_nome, estado_sigla
     FROM bd.municipio
     WHERE REGEXP_REPLACE(LOWER(unaccent(municipio_nome)), '[^a-z0-9]', '', 'g') = $1
       AND UPPER(estado_sigla) = $2
     LIMIT 2`,
    [municipioDominio, estadoSigla],
  );
  if (result.rows.length !== 1) {
    throw repositoryError(
      "Não foi possível identificar um município pelo domínio deste e-mail",
      422,
    );
  }
  return result.rows[0];
}

async function criarCadastroPendente({
  estadoSigla,
  municipioDominio,
  tokenHash,
  usuarioLogin,
  usuarioNome,
  usuarioSenha,
}) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const municipality = await buscarMunicipioPorDominio(
      client,
      municipioDominio,
      estadoSigla,
    );
    const existingUser = await client.query(
      "SELECT 1 FROM bd.usuario WHERE LOWER(usuario_login) = LOWER($1)",
      [usuarioLogin],
    );
    if (existingUser.rows.length > 0) {
      throw repositoryError("Já existe uma conta cadastrada com este e-mail", 409);
    }

    await client.query(
      `DELETE FROM stg.usuario_cadastro_pendente
       WHERE expira_em <= NOW() OR LOWER(usuario_login) = LOWER($1)`,
      [usuarioLogin],
    );
    const cadastroId = crypto.randomUUID();
    await client.query(
      `INSERT INTO stg.usuario_cadastro_pendente
         (cadastro_id, usuario_nome, usuario_login, usuario_senha,
          municipio_cod_ibge, token_hash, expira_em)
       VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '30 minutes')`,
      [
        cadastroId,
        usuarioNome,
        usuarioLogin,
        usuarioSenha,
        municipality.municipio_cod_ibge,
        tokenHash,
      ],
    );
    await client.query("COMMIT");
    return { cadastroId, ...municipality };
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      throw repositoryError("Já existe uma conta cadastrada com este e-mail", 409);
    }
    throw error;
  } finally {
    client.release();
  }
}

async function removerCadastroPendente(cadastroId) {
  await pool.query(
    "DELETE FROM stg.usuario_cadastro_pendente WHERE cadastro_id = $1",
    [cadastroId],
  );
}

async function confirmarCadastro(tokenHash) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const pendingResult = await client.query(
      `SELECT cadastro_id, usuario_nome, usuario_login, usuario_senha,
              municipio_cod_ibge
       FROM stg.usuario_cadastro_pendente
       WHERE token_hash = $1 AND expira_em > NOW()
       FOR UPDATE`,
      [tokenHash],
    );
    const pending = pendingResult.rows[0];
    if (!pending) {
      throw repositoryError("Link de confirmação inválido ou expirado", 410);
    }

    const userResult = await client.query(
      `INSERT INTO bd.usuario
         (usuario_nome, usuario_login, usuario_senha, usuario_funcao, municipio_cod_ibge)
       VALUES ($1, $2, $3, 'prefeitura', $4)
       RETURNING usuario_id, usuario_nome, usuario_login,
                 usuario_funcao, municipio_cod_ibge`,
      [
        pending.usuario_nome,
        pending.usuario_login,
        pending.usuario_senha,
        pending.municipio_cod_ibge,
      ],
    );
    await client.query(
      "DELETE FROM stg.usuario_cadastro_pendente WHERE cadastro_id = $1",
      [pending.cadastro_id],
    );
    await client.query("COMMIT");
    return userResult.rows[0];
  } catch (error) {
    await client.query("ROLLBACK");
    if (error.code === "23505") {
      throw repositoryError("Esta conta já foi cadastrada", 409);
    }
    throw error;
  } finally {
    client.release();
  }
}

async function renovarCadastroPendente(usuarioLogin, tokenHash) {
  const result = await pool.query(
    `UPDATE stg.usuario_cadastro_pendente
     SET token_hash = $2, solicitado_em = NOW(),
         expira_em = NOW() + INTERVAL '30 minutes'
     WHERE LOWER(usuario_login) = LOWER($1)
     RETURNING cadastro_id, usuario_nome, usuario_login`,
    [usuarioLogin, tokenHash],
  );
  return result.rows[0] || null;
}

async function criarSessao({ tokenHash, ttlSeconds, usuarioId }) {
  const sessaoId = crypto.randomUUID();
  await pool.query(
    `DELETE FROM bd.usuario_sessao
     WHERE expira_em <= NOW()
        OR (revogado_em IS NOT NULL AND revogado_em <= NOW() - INTERVAL '30 days')`,
  );
  await pool.query(
    `INSERT INTO bd.usuario_sessao
       (sessao_id, usuario_id, token_hash, expira_em)
     VALUES ($1, $2, $3, NOW() + ($4 * INTERVAL '1 second'))`,
    [sessaoId, usuarioId, tokenHash, ttlSeconds],
  );
  return sessaoId;
}

async function buscarSessaoAtiva(tokenHash, usuarioId) {
  const result = await pool.query(
    `WITH sessao AS (
       UPDATE bd.usuario_sessao
       SET ultimo_acesso_em = NOW()
       WHERE token_hash = $1
         AND usuario_id = $2
         AND revogado_em IS NULL
         AND expira_em > NOW()
       RETURNING usuario_id
     )
     SELECT u.usuario_id, u.usuario_nome, u.usuario_login,
            u.usuario_funcao, u.municipio_cod_ibge
     FROM sessao s
     JOIN bd.usuario u ON u.usuario_id = s.usuario_id`,
    [tokenHash, usuarioId],
  );
  return result.rows[0] || null;
}

async function revogarSessao(tokenHash) {
  await pool.query(
    `UPDATE bd.usuario_sessao
     SET revogado_em = COALESCE(revogado_em, NOW())
     WHERE token_hash = $1`,
    [tokenHash],
  );
}

async function criarRedefinicaoSenha(usuarioLogin, tokenHash) {
  await pool.query(
    "DELETE FROM stg.usuario_redefinicao_senha WHERE expira_em <= NOW()",
  );
  const userResult = await pool.query(
    `SELECT usuario_id, usuario_nome, usuario_login
     FROM bd.usuario
     WHERE LOWER(usuario_login) = LOWER($1)
     LIMIT 1`,
    [usuarioLogin],
  );
  const user = userResult.rows[0];
  if (!user) return null;

  await pool.query(
    `INSERT INTO stg.usuario_redefinicao_senha
       (redefinicao_id, usuario_id, token_hash, expira_em)
     VALUES ($1, $2, $3, NOW() + INTERVAL '30 minutes')
     ON CONFLICT (usuario_id)
     DO UPDATE SET token_hash = EXCLUDED.token_hash,
                   solicitado_em = NOW(),
                   expira_em = EXCLUDED.expira_em`,
    [crypto.randomUUID(), user.usuario_id, tokenHash],
  );
  return user;
}

async function confirmarRedefinicaoSenha(tokenHash, usuarioSenha) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const resetResult = await client.query(
      `SELECT redefinicao_id, usuario_id
       FROM stg.usuario_redefinicao_senha
       WHERE token_hash = $1 AND expira_em > NOW()
       FOR UPDATE`,
      [tokenHash],
    );
    const reset = resetResult.rows[0];
    if (!reset) {
      throw repositoryError("Link de redefinição inválido ou expirado", 410);
    }

    await client.query(
      "UPDATE bd.usuario SET usuario_senha = $2 WHERE usuario_id = $1",
      [reset.usuario_id, usuarioSenha],
    );
    await client.query(
      "DELETE FROM stg.usuario_redefinicao_senha WHERE usuario_id = $1",
      [reset.usuario_id],
    );
    await client.query(
      `UPDATE bd.usuario_sessao
       SET revogado_em = COALESCE(revogado_em, NOW())
       WHERE usuario_id = $1`,
      [reset.usuario_id],
    );
    await client.query("COMMIT");
    return Number(reset.usuario_id);
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function registrarEventoAutenticacao({
  enderecoIp,
  eventoTipo,
  userAgent,
  usuarioId = null,
  usuarioLogin = null,
}) {
  try {
    await pool.query(
      `INSERT INTO stg.autenticacao_evento
         (usuario_id, evento_tipo, usuario_login, endereco_ip, user_agent)
       VALUES ($1, $2, $3, $4, $5)`,
      [usuarioId, eventoTipo, usuarioLogin, enderecoIp, String(userAgent || "").slice(0, 500)],
    );
  } catch (error) {
    console.error("Falha ao registrar evento de autenticação:", error.message);
  }
}

module.exports = {
  atualizarSenhaUsuario,
  buscarSessaoAtiva,
  buscarUsuarioPorId,
  buscarUsuarioPorLogin,
  confirmarCadastro,
  confirmarRedefinicaoSenha,
  criarRedefinicaoSenha,
  criarSessao,
  criarCadastroPendente,
  registrarEventoAutenticacao,
  removerCadastroPendente,
  renovarCadastroPendente,
  revogarSessao,
};
