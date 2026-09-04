BEGIN;

CREATE TABLE IF NOT EXISTS bd.usuario_sessao (
  sessao_id uuid PRIMARY KEY,
  usuario_id integer NOT NULL REFERENCES bd.usuario(usuario_id) ON DELETE CASCADE,
  token_hash character varying(64) NOT NULL UNIQUE,
  criado_em timestamp without time zone NOT NULL DEFAULT NOW(),
  expira_em timestamp without time zone NOT NULL,
  revogado_em timestamp without time zone,
  ultimo_acesso_em timestamp without time zone NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS usuario_sessao_usuario_idx
  ON bd.usuario_sessao (usuario_id, expira_em);

CREATE TABLE IF NOT EXISTS stg.usuario_redefinicao_senha (
  redefinicao_id uuid PRIMARY KEY,
  usuario_id integer NOT NULL REFERENCES bd.usuario(usuario_id) ON DELETE CASCADE,
  token_hash character varying(64) NOT NULL UNIQUE,
  solicitado_em timestamp without time zone NOT NULL DEFAULT NOW(),
  expira_em timestamp without time zone NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS usuario_redefinicao_senha_usuario_uidx
  ON stg.usuario_redefinicao_senha (usuario_id);

CREATE INDEX IF NOT EXISTS usuario_redefinicao_senha_expira_idx
  ON stg.usuario_redefinicao_senha (expira_em);

CREATE TABLE IF NOT EXISTS stg.autenticacao_evento (
  evento_id bigserial PRIMARY KEY,
  usuario_id integer REFERENCES bd.usuario(usuario_id) ON DELETE SET NULL,
  evento_tipo character varying(50) NOT NULL,
  usuario_login character varying,
  endereco_ip character varying(64),
  user_agent character varying(500),
  criado_em timestamp without time zone NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS autenticacao_evento_tipo_data_idx
  ON stg.autenticacao_evento (evento_tipo, criado_em DESC);

COMMIT;
