from __future__ import annotations

import argparse
import json
import os
import re
from dataclasses import dataclass
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Sequence, Tuple

import pandas as pd
from dotenv import load_dotenv
from psycopg2.extensions import connection
from psycopg2.extras import execute_values

from conexao_consulta import get_connection
from indicadores.calculator import INDICADOR_VALOR_TEXTUAL_IDS


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_FILE = BASE_DIR / "dados" / "formularios.xlsx"
DEFAULT_SHEET = "Planilha1"
EXPECTED_COLUMNS = {
    "municipio_cod_ibge",
    "ano",
    "indicador_referencia",
    "indicador_valor",
    "indicador_valor_textual",
}
UPSERT_TABLES = {
    "stg.municipio_apresenta_indicador",
    "bd.municipio_apresenta_indicador",
}


@dataclass(frozen=True)
class FormularioRow:
    municipio_cod_ibge: int
    indicador_referencia: int
    ano: int
    indicador_valor: Decimal
    indicador_valor_textual: Optional[str]
    excel_row: int

    @property
    def key(self) -> Tuple[int, int, int]:
        return self.municipio_cod_ibge, self.indicador_referencia, self.ano

    def database_values(self) -> Tuple[int, int, int, Decimal, None, Optional[str]]:
        return (
            self.municipio_cod_ibge,
            self.indicador_referencia,
            self.ano,
            self.indicador_valor,
            None,
            self.indicador_valor_textual,
        )


def carregar_config() -> Dict[str, object]:
    env_path = BASE_DIR / "dados_conexao.env"
    load_dotenv(env_path, override=True)

    required = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD"]
    missing = [name for name in required if not os.getenv(name)]
    if missing:
        raise ValueError(
            "Configuracoes de banco ausentes em dados_conexao.env: "
            + ", ".join(missing)
        )

    return {
        "host": os.getenv("DB_HOST"),
        "port": int(os.getenv("DB_PORT", "5432")),
        "database": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
    }


def normalizar_colunas(columns: Iterable[object]) -> List[str]:
    return [
        str(column).strip().lower().replace(" ", "_").replace("-", "_")
        for column in columns
    ]


def valor_vazio(value: object) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        return not value.strip()
    return bool(pd.isna(value))


def converter_inteiro(value: object, column: str, excel_row: int) -> int:
    if valor_vazio(value):
        raise ValueError(f"Linha {excel_row}: {column} nao pode ser vazio")

    try:
        number = Decimal(str(value))
    except InvalidOperation as exc:
        raise ValueError(
            f"Linha {excel_row}: {column} invalido: {value!r}"
        ) from exc

    if not number.is_finite() or number != number.to_integral_value():
        raise ValueError(
            f"Linha {excel_row}: {column} deve ser um numero inteiro: {value!r}"
        )
    return int(number)


def converter_decimal(value: object, column: str, excel_row: int) -> Optional[Decimal]:
    if valor_vazio(value):
        return None

    try:
        number = Decimal(str(value))
    except InvalidOperation as exc:
        raise ValueError(
            f"Linha {excel_row}: {column} invalido: {value!r}"
        ) from exc

    if not number.is_finite():
        raise ValueError(
            f"Linha {excel_row}: {column} deve ser um numero finito: {value!r}"
        )
    return number


def converter_texto(value: object) -> Optional[str]:
    if valor_vazio(value):
        return None
    text = str(value).strip()
    return text or None


def ler_e_validar_planilha(path: Path, sheet_name: str) -> List[FormularioRow]:
    if not path.is_file():
        raise FileNotFoundError(f"Planilha nao encontrada: {path}")

    frame = pd.read_excel(path, sheet_name=sheet_name)
    frame.columns = normalizar_colunas(frame.columns)

    actual_columns = set(frame.columns)
    missing_columns = sorted(EXPECTED_COLUMNS - actual_columns)
    extra_columns = sorted(actual_columns - EXPECTED_COLUMNS)
    if missing_columns or extra_columns:
        details = []
        if missing_columns:
            details.append("ausentes: " + ", ".join(missing_columns))
        if extra_columns:
            details.append("inesperadas: " + ", ".join(extra_columns))
        raise ValueError("Colunas invalidas na planilha (" + "; ".join(details) + ")")

    if frame.empty:
        raise ValueError("A planilha nao possui linhas de dados")

    rows: List[FormularioRow] = []
    errors: List[str] = []
    for index, raw_row in frame.iterrows():
        excel_row = int(index) + 2
        try:
            municipio = converter_inteiro(
                raw_row["municipio_cod_ibge"], "municipio_cod_ibge", excel_row
            )
            indicador = converter_inteiro(
                raw_row["indicador_referencia"], "indicador_referencia", excel_row
            )
            ano = converter_inteiro(raw_row["ano"], "ano", excel_row)
            valor = converter_decimal(
                raw_row["indicador_valor"], "indicador_valor", excel_row
            )
            texto = converter_texto(raw_row["indicador_valor_textual"])

            if (valor is None) == (texto is None):
                raise ValueError(
                    f"Linha {excel_row}: preencha exatamente um entre "
                    "indicador_valor e indicador_valor_textual"
                )
            if str(indicador) not in INDICADOR_VALOR_TEXTUAL_IDS:
                raise ValueError(
                    f"Linha {excel_row}: indicador {indicador} nao pertence a "
                    "INDICADOR_VALOR_TEXTUAL_IDS"
                )

            rows.append(
                FormularioRow(
                    municipio_cod_ibge=municipio,
                    indicador_referencia=indicador,
                    ano=ano,
                    indicador_valor=valor if valor is not None else Decimal("0"),
                    indicador_valor_textual=texto,
                    excel_row=excel_row,
                )
            )
        except ValueError as exc:
            errors.append(str(exc))

    if errors:
        preview = "\n".join(errors[:20])
        suffix = f"\n... e mais {len(errors) - 20} erro(s)" if len(errors) > 20 else ""
        raise ValueError(f"Planilha invalida:\n{preview}{suffix}")

    rows_by_key: Dict[Tuple[int, int, int], List[int]] = {}
    for row in rows:
        rows_by_key.setdefault(row.key, []).append(row.excel_row)

    duplicates = {
        key: excel_rows
        for key, excel_rows in rows_by_key.items()
        if len(excel_rows) > 1
    }
    if duplicates:
        preview = "; ".join(
            f"{key} nas linhas {excel_rows}"
            for key, excel_rows in list(duplicates.items())[:10]
        )
        raise ValueError(f"Chaves duplicadas na planilha: {preview}")

    return rows


def anos_com_particao_bd(conn: connection) -> set[int]:
    query = """
        SELECT pg_get_expr(child.relpartbound, child.oid)
        FROM pg_inherits inheritance
        JOIN pg_class child ON child.oid = inheritance.inhrelid
        JOIN pg_class parent ON parent.oid = inheritance.inhparent
        JOIN pg_namespace namespace ON namespace.oid = parent.relnamespace
        WHERE namespace.nspname = 'bd'
          AND parent.relname = 'municipio_apresenta_indicador'
    """
    with conn.cursor() as cursor:
        cursor.execute(query)
        bounds = cursor.fetchall()

    years: set[int] = set()
    pattern = re.compile(r"FROM \((\d+)\) TO \((\d+)\)")
    for (bound,) in bounds:
        match = pattern.search(str(bound or ""))
        if not match:
            continue
        start, end = (int(value) for value in match.groups())
        years.update(range(start, end))
    return years


def validar_referencias_banco(conn: connection, rows: Sequence[FormularioRow]) -> None:
    municipios = sorted({row.municipio_cod_ibge for row in rows})
    indicadores = sorted({row.indicador_referencia for row in rows})
    anos = sorted({row.ano for row in rows})

    with conn.cursor() as cursor:
        cursor.execute(
            "SELECT municipio_cod_ibge FROM bd.municipio "
            "WHERE municipio_cod_ibge = ANY(%s)",
            (municipios,),
        )
        municipios_existentes = {int(result[0]) for result in cursor.fetchall()}

        cursor.execute(
            "SELECT indicador_referencia FROM bd.indicador "
            "WHERE indicador_referencia = ANY(%s)",
            (indicadores,),
        )
        indicadores_existentes = {int(result[0]) for result in cursor.fetchall()}

    municipios_ausentes = sorted(set(municipios) - municipios_existentes)
    indicadores_ausentes = sorted(set(indicadores) - indicadores_existentes)
    anos_ausentes = sorted(set(anos) - anos_com_particao_bd(conn))

    errors = []
    if municipios_ausentes:
        errors.append(
            "municipios inexistentes em bd.municipio: "
            + ", ".join(map(str, municipios_ausentes[:20]))
        )
    if indicadores_ausentes:
        errors.append(
            "indicadores inexistentes em bd.indicador: "
            + ", ".join(map(str, indicadores_ausentes[:20]))
        )
    if anos_ausentes:
        errors.append(
            "anos sem particao em bd.municipio_apresenta_indicador: "
            + ", ".join(map(str, anos_ausentes))
        )
    if errors:
        raise ValueError("Referencias invalidas no banco:\n" + "\n".join(errors))


def calcular_impacto_bd(
    conn: connection, rows: Sequence[FormularioRow]
) -> Dict[str, int]:
    values = [row.database_values() for row in rows]
    query = """
        WITH entrada(
            municipio_cod_ibge,
            indicador_referencia,
            ano,
            indicador_valor,
            texto,
            indicador_valor_textual
        ) AS (VALUES %s)
        SELECT
            COUNT(*) FILTER (WHERE atual.municipio_cod_ibge IS NULL)::integer AS novos,
            COUNT(*) FILTER (
                WHERE atual.municipio_cod_ibge IS NOT NULL
                  AND (
                    atual.indicador_valor IS DISTINCT FROM entrada.indicador_valor
                    OR atual.texto IS DISTINCT FROM entrada.texto
                    OR atual.indicador_valor_textual IS DISTINCT FROM entrada.indicador_valor_textual
                  )
            )::integer AS alterados,
            COUNT(*) FILTER (
                WHERE atual.municipio_cod_ibge IS NOT NULL
                  AND atual.indicador_valor IS NOT DISTINCT FROM entrada.indicador_valor
                  AND atual.texto IS NOT DISTINCT FROM entrada.texto
                  AND atual.indicador_valor_textual IS NOT DISTINCT FROM entrada.indicador_valor_textual
            )::integer AS inalterados
        FROM entrada
        LEFT JOIN bd.municipio_apresenta_indicador atual
          ON atual.municipio_cod_ibge = entrada.municipio_cod_ibge
         AND atual.indicador_referencia = entrada.indicador_referencia
         AND atual.ano = entrada.ano
    """
    with conn.cursor() as cursor:
        execute_values(cursor, query, values, page_size=len(values))
        novos, alterados, inalterados = cursor.fetchone()
    return {
        "novos": int(novos),
        "alterados": int(alterados),
        "inalterados": int(inalterados),
    }


def upsert_rows(
    conn: connection, table_name: str, rows: Sequence[FormularioRow]
) -> int:
    if table_name not in UPSERT_TABLES:
        raise ValueError(f"Tabela de destino nao permitida: {table_name}")

    values = [row.database_values() for row in rows]
    query = f"""
        INSERT INTO {table_name} AS destino
        (
            municipio_cod_ibge,
            indicador_referencia,
            ano,
            indicador_valor,
            texto,
            indicador_valor_textual,
            indicador_nivel,
            topico_nivel,
            dimensao_nivel,
            municipio_nivel
        )
        VALUES %s
        ON CONFLICT (municipio_cod_ibge, indicador_referencia, ano)
        DO UPDATE SET
            indicador_valor = EXCLUDED.indicador_valor,
            texto = EXCLUDED.texto,
            indicador_valor_textual = EXCLUDED.indicador_valor_textual,
            indicador_nivel = CASE
                WHEN destino.indicador_valor IS DISTINCT FROM EXCLUDED.indicador_valor
                  OR destino.texto IS DISTINCT FROM EXCLUDED.texto
                  OR destino.indicador_valor_textual IS DISTINCT FROM EXCLUDED.indicador_valor_textual
                THEN NULL
                ELSE destino.indicador_nivel
            END,
            topico_nivel = CASE
                WHEN destino.indicador_valor IS DISTINCT FROM EXCLUDED.indicador_valor
                  OR destino.texto IS DISTINCT FROM EXCLUDED.texto
                  OR destino.indicador_valor_textual IS DISTINCT FROM EXCLUDED.indicador_valor_textual
                THEN NULL
                ELSE destino.topico_nivel
            END,
            dimensao_nivel = CASE
                WHEN destino.indicador_valor IS DISTINCT FROM EXCLUDED.indicador_valor
                  OR destino.texto IS DISTINCT FROM EXCLUDED.texto
                  OR destino.indicador_valor_textual IS DISTINCT FROM EXCLUDED.indicador_valor_textual
                THEN NULL
                ELSE destino.dimensao_nivel
            END,
            municipio_nivel = CASE
                WHEN destino.indicador_valor IS DISTINCT FROM EXCLUDED.indicador_valor
                  OR destino.texto IS DISTINCT FROM EXCLUDED.texto
                  OR destino.indicador_valor_textual IS DISTINCT FROM EXCLUDED.indicador_valor_textual
                THEN NULL
                ELSE destino.municipio_nivel
            END
        RETURNING 1
    """
    template = "(%s, %s, %s, %s, %s, %s, NULL, NULL, NULL, NULL)"
    with conn.cursor() as cursor:
        affected = execute_values(
            cursor,
            query,
            values,
            template=template,
            page_size=len(values),
            fetch=True,
        )
    return len(affected)


def build_summary(
    path: Path,
    sheet_name: str,
    rows: Sequence[FormularioRow],
    impact: Dict[str, int],
    execute: bool,
) -> Dict[str, object]:
    textual_rows = sum(row.indicador_valor_textual is not None for row in rows)
    return {
        "modo": "execucao" if execute else "validacao",
        "arquivo": str(path),
        "aba": sheet_name,
        "linhas": len(rows),
        "municipios": len({row.municipio_cod_ibge for row in rows}),
        "indicadores": len({row.indicador_referencia for row in rows}),
        "anos": sorted({row.ano for row in rows}),
        "linhas_numericas": len(rows) - textual_rows,
        "linhas_textuais": textual_rows,
        "impacto_bd": impact,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Valida e importa formularios.xlsx em "
            "stg.municipio_apresenta_indicador e bd.municipio_apresenta_indicador."
        )
    )
    parser.add_argument(
        "--arquivo",
        type=Path,
        default=DEFAULT_FILE,
        help=f"Caminho da planilha (padrao: {DEFAULT_FILE})",
    )
    parser.add_argument(
        "--aba",
        default=DEFAULT_SHEET,
        help=f"Nome da aba (padrao: {DEFAULT_SHEET})",
    )
    parser.add_argument(
        "--executar",
        action="store_true",
        help="Confirma a gravacao transacional em stg e bd. Sem esta opcao, apenas valida.",
    )
    args = parser.parse_args()

    path = args.arquivo.expanduser().resolve()
    rows = ler_e_validar_planilha(path, args.aba)

    conn = get_connection(**carregar_config())
    try:
        validar_referencias_banco(conn, rows)
        impact = calcular_impacto_bd(conn, rows)
        summary = build_summary(path, args.aba, rows, impact, args.executar)

        if args.executar:
            summary["linhas_processadas_stg"] = upsert_rows(
                conn, "stg.municipio_apresenta_indicador", rows
            )
            summary["linhas_processadas_bd"] = upsert_rows(
                conn, "bd.municipio_apresenta_indicador", rows
            )
            conn.commit()
        else:
            conn.rollback()

        print(json.dumps(summary, ensure_ascii=False, indent=2))
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
