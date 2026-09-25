BEGIN;

CREATE TABLE IF NOT EXISTS stg.email_outbox (
  email_id uuid PRIMARY KEY,
  email_tipo character varying(40) NOT NULL,
  destinatario character varying(254) NOT NULL,
  payload_criptografado text,
  status character varying(20) NOT NULL DEFAULT 'PENDENTE',
  tentativas integer NOT NULL DEFAULT 0,
  proxima_tentativa_em timestamp without time zone NOT NULL DEFAULT NOW(),
  bloqueado_ate timestamp without time zone,
  ultimo_erro character varying(1000),
  criado_em timestamp without time zone NOT NULL DEFAULT NOW(),
  atualizado_em timestamp without time zone NOT NULL DEFAULT NOW(),
  expira_em timestamp without time zone NOT NULL,
  CONSTRAINT email_outbox_tipo_check
    CHECK (email_tipo IN ('ACCOUNT_CONFIRMATION', 'PASSWORD_RESET')),
  CONSTRAINT email_outbox_status_check
    CHECK (status IN ('PENDENTE', 'PROCESSANDO', 'FALHOU')),
  CONSTRAINT email_outbox_tentativas_check
    CHECK (tentativas BETWEEN 0 AND 6)
);

CREATE INDEX IF NOT EXISTS email_outbox_processamento_idx
  ON stg.email_outbox (status, proxima_tentativa_em, criado_em)
  WHERE payload_criptografado IS NOT NULL;

CREATE INDEX IF NOT EXISTS email_outbox_expiracao_idx
  ON stg.email_outbox (expira_em);

COMMIT;
