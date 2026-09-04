BEGIN;

UPDATE bd.usuario
SET usuario_funcao = CASE
  WHEN usuario_funcao IS NULL OR BTRIM(usuario_funcao) = '' THEN 'prefeitura'
  WHEN LOWER(BTRIM(usuario_funcao)) IN ('admin', 'administrador', 'validador') THEN 'admin'
  WHEN LOWER(BTRIM(usuario_funcao)) = 'prefeitura' THEN 'prefeitura'
  ELSE LOWER(BTRIM(usuario_funcao))
END;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM bd.usuario
    WHERE usuario_funcao NOT IN ('prefeitura', 'admin')
  ) THEN
    RAISE EXCEPTION 'Existem usuários com função incompatível com prefeitura/admin';
  END IF;
END $$;

ALTER TABLE bd.usuario
  ALTER COLUMN usuario_funcao SET DEFAULT 'prefeitura',
  ALTER COLUMN usuario_funcao SET NOT NULL;

ALTER TABLE bd.usuario
  DROP CONSTRAINT IF EXISTS usuario_funcao_valida_check;

ALTER TABLE bd.usuario
  ADD CONSTRAINT usuario_funcao_valida_check
  CHECK (usuario_funcao IN ('prefeitura', 'admin'));

COMMIT;
