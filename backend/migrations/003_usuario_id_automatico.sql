BEGIN;

DO $$
DECLARE
  usuario_id_sequence text;
BEGIN
  usuario_id_sequence := pg_get_serial_sequence('bd.usuario', 'usuario_id');

  IF usuario_id_sequence IS NULL THEN
    CREATE SEQUENCE IF NOT EXISTS bd.usuario_usuario_id_seq;
    ALTER SEQUENCE bd.usuario_usuario_id_seq
      OWNED BY bd.usuario.usuario_id;
    ALTER TABLE bd.usuario
      ALTER COLUMN usuario_id
      SET DEFAULT nextval('bd.usuario_usuario_id_seq');
    usuario_id_sequence := 'bd.usuario_usuario_id_seq';
  END IF;

  EXECUTE format(
    'SELECT setval(%L, COALESCE((SELECT MAX(usuario_id) FROM bd.usuario), 0) + 1, false)',
    usuario_id_sequence
  );
END $$;

COMMIT;
