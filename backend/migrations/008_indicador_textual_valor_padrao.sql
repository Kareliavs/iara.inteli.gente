BEGIN;

CREATE OR REPLACE FUNCTION bd.fn_atualizar_indicador_textual()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  r_indicador record;
  v_texto text;
BEGIN
  IF NEW.variavel_valor_textual IS NULL
     OR BTRIM(NEW.variavel_valor_textual) = '' THEN
    RETURN NEW;
  END IF;

  FOR r_indicador IN
    SELECT DISTINCT indicador_referencia
    FROM bd.indicador_apresenta_variavel
    WHERE variavel_sigla = NEW.variavel_sigla
  LOOP
    IF EXISTS (
      SELECT 1
      FROM bd.indicador_apresenta_variavel iv
      WHERE iv.indicador_referencia = r_indicador.indicador_referencia
        AND NOT EXISTS (
          SELECT 1
          FROM bd.municipio_apresenta_variavel mv
          WHERE mv.municipio_cod_ibge = NEW.municipio_cod_ibge
            AND mv.ano = NEW.ano
            AND mv.variavel_sigla = iv.variavel_sigla
            AND mv.variavel_valor_textual IS NOT NULL
            AND BTRIM(mv.variavel_valor_textual) <> ''
        )
    ) THEN
      CONTINUE;
    END IF;

    SELECT STRING_AGG(
             mv.variavel_valor_textual,
             ', '
             ORDER BY iv.variavel_sigla
           )
    INTO v_texto
    FROM bd.indicador_apresenta_variavel iv
    JOIN bd.municipio_apresenta_variavel mv
      ON mv.variavel_sigla = iv.variavel_sigla
    WHERE iv.indicador_referencia = r_indicador.indicador_referencia
      AND mv.municipio_cod_ibge = NEW.municipio_cod_ibge
      AND mv.ano = NEW.ano;

    INSERT INTO bd.municipio_apresenta_indicador
      (municipio_cod_ibge, indicador_referencia, ano,
       indicador_valor, indicador_valor_textual)
    VALUES
      (NEW.municipio_cod_ibge, r_indicador.indicador_referencia,
       NEW.ano, 0, v_texto)
    ON CONFLICT (municipio_cod_ibge, indicador_referencia, ano)
    DO UPDATE SET
      indicador_valor_textual = EXCLUDED.indicador_valor_textual;
  END LOOP;

  RETURN NEW;
END;
$$;

COMMIT;
