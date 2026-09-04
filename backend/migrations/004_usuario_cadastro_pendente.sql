BEGIN;

CREATE TABLE IF NOT EXISTS stg.usuario_cadastro_pendente (
  cadastro_id uuid PRIMARY KEY,
  usuario_nome character varying NOT NULL,
  usuario_login character varying NOT NULL,
  usuario_senha character varying NOT NULL,
  municipio_cod_ibge integer NOT NULL
    REFERENCES bd.municipio(municipio_cod_ibge),
  token_hash character varying(64) NOT NULL UNIQUE,
  solicitado_em timestamp without time zone NOT NULL DEFAULT NOW(),
  expira_em timestamp without time zone NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS usuario_cadastro_pendente_login_lower_uidx
  ON stg.usuario_cadastro_pendente (LOWER(usuario_login));

CREATE INDEX IF NOT EXISTS usuario_cadastro_pendente_expira_idx
  ON stg.usuario_cadastro_pendente (expira_em);

COMMIT;
