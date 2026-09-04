BEGIN;

CREATE UNIQUE INDEX IF NOT EXISTS usuario_login_lower_uidx
  ON bd.usuario (LOWER(usuario_login));

CREATE TABLE IF NOT EXISTS stg.formulario_submissao (
  submissao_id uuid PRIMARY KEY,
  usuario_id integer NOT NULL REFERENCES bd.usuario(usuario_id),
  municipio_cod_ibge integer NOT NULL REFERENCES bd.municipio(municipio_cod_ibge),
  ano integer NOT NULL,
  status character varying(20) NOT NULL DEFAULT 'PENDENTE',
  enviado_em timestamp without time zone NOT NULL DEFAULT NOW(),
  validado_em timestamp without time zone,
  validado_por integer REFERENCES bd.usuario(usuario_id),
  motivo_rejeicao character varying(1000),
  CONSTRAINT formulario_submissao_status_check
    CHECK (status IN ('PENDENTE', 'APROVADA', 'REJEITADA')),
  CONSTRAINT formulario_submissao_ano_check
    CHECK (ano BETWEEN 2000 AND 2100)
);

ALTER TABLE stg.municipio_apresenta_variavel
  ADD COLUMN IF NOT EXISTS variavel_valor_textual character varying,
  ADD COLUMN IF NOT EXISTS submissao_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'municipio_apresenta_variavel_submissao_fkey'
      AND conrelid = 'stg.municipio_apresenta_variavel'::regclass
  ) THEN
    ALTER TABLE stg.municipio_apresenta_variavel
      ADD CONSTRAINT municipio_apresenta_variavel_submissao_fkey
      FOREIGN KEY (submissao_id)
      REFERENCES stg.formulario_submissao(submissao_id)
      NOT VALID;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS formulario_submissao_status_data_idx
  ON stg.formulario_submissao (status, enviado_em);

CREATE UNIQUE INDEX IF NOT EXISTS formulario_submissao_pendente_municipio_ano_uidx
  ON stg.formulario_submissao (municipio_cod_ibge, ano)
  WHERE status = 'PENDENTE';

COMMIT;

CREATE INDEX CONCURRENTLY IF NOT EXISTS municipio_apresenta_variavel_submissao_idx
  ON stg.municipio_apresenta_variavel (submissao_id)
  WHERE submissao_id IS NOT NULL;
