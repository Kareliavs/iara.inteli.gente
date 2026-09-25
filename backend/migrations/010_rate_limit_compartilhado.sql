BEGIN;

CREATE TABLE IF NOT EXISTS stg.rate_limit_bucket (
  chave_hash character varying(64) NOT NULL,
  janela_inicio timestamp with time zone NOT NULL,
  contador integer NOT NULL DEFAULT 1,
  expira_em timestamp with time zone NOT NULL,
  PRIMARY KEY (chave_hash, janela_inicio),
  CONSTRAINT rate_limit_contador_positivo_check CHECK (contador > 0)
);

CREATE INDEX IF NOT EXISTS rate_limit_bucket_expiracao_idx
  ON stg.rate_limit_bucket (expira_em);

COMMIT;
