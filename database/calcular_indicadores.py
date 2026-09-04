import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import os
import re
import time
from collections import Counter
from pathlib import Path
from typing import Dict, List, Optional, Set, Tuple

from dotenv import load_dotenv
from psycopg2.extras import execute_values

from conexao_consulta import execute_query, get_connection
from indicadores.core.helpers import to_number
from indicadores import INDICATOR_SPECS, calculate_indicator, list_indicator_ids, required_siglas


CROSS_YEAR_INDICATOR_IDS = {"3039", "4010", "4017", "4066", "6044"}
CALCULATE_WITH_ALL_VARIABLES_MISSING_IDS = {
    "3006",
    "3042",
    "3043",
    "3048",
    "3049",
    "3056",
    "3069",
    "3076",
    "3113",
    "3123",
    "3125",
    "4004",
    "4006",
    "4012",
    "4014",
    "4040",
    "6002",
    "6003",
    "6005",
    "6006",
    "6009",
    "6011",
    "6017",
    "6019",
    "6021",
    "6024",
    "6035",
    "6048",
    "6054",
}
CALCULATE_WITH_ALL_VARIABLES_MISSING_YEARS = {
    indicator_id: {2024}
    for indicator_id in CALCULATE_WITH_ALL_VARIABLES_MISSING_IDS
}


def carregar_config() -> Dict[str, object]:
    env_path = Path(__file__).resolve().parent / "dados_conexao.env"
    load_dotenv(env_path, override=True)
    return {
        "host": os.getenv("DB_HOST"),
        "port": int(os.getenv("DB_PORT", 5432)),
        "database": os.getenv("DB_NAME"),
        "user": os.getenv("DB_USER"),
        "password": os.getenv("DB_PASSWORD"),
    }


def buscar_variaveis_municipio_por_ano(
    conn, municipio_cod_ibge: int, siglas: List[str]
) -> Dict[int, Dict[str, float]]:
    query = """
        SELECT
            variavel_sigla,
            variavel_valor,
            ano
                FROM bd.municipio_apresenta_variavel
                WHERE municipio_cod_ibge = %s
                    AND variavel_sigla = ANY(%s)
                    AND ano IS NOT NULL
                ORDER BY ano, variavel_sigla
    """

    cur = conn.cursor()
    try:
        cur.execute(query, (municipio_cod_ibge, siglas))
        rows = cur.fetchall()
    finally:
        cur.close()

    variaveis_por_ano: Dict[int, Dict[str, float]] = {}
    for sigla, valor, ano in rows:
        if valor is None:
            continue
        if isinstance(valor, str) and valor.strip() == "":
            continue

        ano_int = int(ano)
        if ano_int not in variaveis_por_ano:
            variaveis_por_ano[ano_int] = {}
        variaveis_por_ano[ano_int][str(sigla)] = float(to_number(valor))

    return variaveis_por_ano


def _preparar_variaveis_indicador_por_ano(
    variaveis_ano: Dict[str, float],
    ano: int,
    siglas_indicador: Set[str],
    pop_tot_por_ano: Dict[int, float],
    calcular_sem_variaveis: bool = False,
) -> Tuple[Optional[Dict[str, float]], Optional[Dict[str, int]]]:
    siglas_disponiveis = set(variaveis_ano.keys())
    if "POP_TOT" not in siglas_indicador:
        if siglas_indicador.isdisjoint(siglas_disponiveis):
            if calcular_sem_variaveis:
                return {}, {}
            return None, None
        return variaveis_ano, {sigla: int(ano) for sigla in variaveis_ano.keys()}

    siglas_sem_pop_tot = siglas_indicador - {"POP_TOT"}
    if siglas_sem_pop_tot:
        if not siglas_sem_pop_tot.issubset(siglas_disponiveis):
            return None, None
    elif "POP_TOT" not in siglas_disponiveis:
        return None, None

    variaveis_calculo = dict(variaveis_ano)
    anos_variaveis = {sigla: int(ano) for sigla in variaveis_calculo.keys()}
    if "POP_TOT" not in variaveis_calculo and pop_tot_por_ano:
        ano_pop_tot, valor_pop_tot = min(
            pop_tot_por_ano.items(),
            key=lambda item: (abs(int(item[0]) - int(ano)), int(item[0]) > int(ano), int(item[0])),
        )
        variaveis_calculo["POP_TOT"] = float(valor_pop_tot)
        anos_variaveis["POP_TOT"] = int(ano_pop_tot)

    return variaveis_calculo, anos_variaveis


def listar_municipios(conn) -> List[int]:
    rows = execute_query(
        conn,
        "SELECT municipio_cod_ibge FROM bd.municipio ORDER BY municipio_cod_ibge",
        return_data=True,
    )
    return [int(row[0]) for row in rows]


def buscar_indicadores_existentes_bd(
    conn,
    municipio_cod_ibge: int,
    anos: List[int],
    indicator_ids: List[str],
) -> Set[Tuple[int, str]]:
    if not anos or not indicator_ids:
        return set()

    cur = conn.cursor()
    try:
        cur.execute(
            """
            SELECT ano, indicador_referencia
            FROM bd.municipio_apresenta_indicador
            WHERE municipio_cod_ibge = %s
              AND ano = ANY(%s)
              AND indicador_referencia = ANY(%s)
            """,
            (
                municipio_cod_ibge,
                [int(ano) for ano in anos],
                [int(indicator_id) for indicator_id in indicator_ids],
            ),
        )
        rows = cur.fetchall()
    finally:
        cur.close()

    return {(int(ano), str(indicador_referencia)) for ano, indicador_referencia in rows}


def _resolver_ano_indicador(resultado: Dict[str, object]) -> Optional[int]:
    ano_referencia = resultado.get("ano_referencia")
    if ano_referencia is not None:
        return int(ano_referencia)

    anos_variaveis = resultado.get("anos_variaveis") or {}
    if not isinstance(anos_variaveis, dict) or not anos_variaveis:
        return None

    anos = [int(ano) for ano in anos_variaveis.values() if ano is not None]
    if not anos:
        return None

    # Ano de referencia do indicador: ano mais recente entre as variaveis utilizadas.
    return max(anos)


def _coerce_indicador_numerico(resultado: Dict[str, object]) -> float:
    valor = resultado.get("indicador")
    if isinstance(valor, str):
        valor = valor.strip()
        if valor == "":
            indicador_id = resultado.get("indicador_id")
            raise ValueError(f"Indicador nao numerico: {indicador_id} -> ''")

    try:
        return float(valor)
    except (TypeError, ValueError):
        indicador_id = resultado.get("indicador_id")
        raise ValueError(f"Indicador nao numerico: {indicador_id} -> {valor!r}")


def _extrair_valores_indicador(
    resultado: Dict[str, object],
) -> Tuple[Optional[float], Optional[str], Optional[str]]:
    valor = resultado.get("indicador")
    texto = resultado.get("indicador_texto")
    indicador_texto = None if texto is None else str(texto)
    valor_textual = resultado.get("indicador_valor_textual")
    indicador_valor_textual = None if valor_textual is None else str(valor_textual)

    if isinstance(valor, str):
        valor_limpo = valor.strip()
        if valor_limpo == "":
            return 0.0, indicador_texto, indicador_valor_textual

        try:
            return float(valor_limpo), indicador_texto, indicador_valor_textual
        except ValueError:
            if indicador_texto is None and indicador_valor_textual is None:
                indicador_texto = valor_limpo
            return 0.0, indicador_texto, indicador_valor_textual

    if valor is None:
        indicador_id = resultado.get("indicador_id")
        raise ValueError(f"Indicador sem valor: {indicador_id} -> None")

    try:
        return float(valor), indicador_texto, indicador_valor_textual
    except (TypeError, ValueError):
        indicador_id = resultado.get("indicador_id")
        raise ValueError(f"Indicador com valor invalido: {indicador_id} -> {valor!r}")


def _extrair_variaveis_faltantes(msg: str) -> List[str]:
    prefixos = [
        "Variaveis obrigatorias nao encontradas:",
        "Variavel obrigatoria nao encontrada:",
    ]
    for prefixo in prefixos:
        if msg.startswith(prefixo):
            bruto = msg.replace(prefixo, "", 1).strip()
            if not bruto:
                return []
            return [item.strip() for item in bruto.split(",") if item.strip()]
    return []


def _classificar_motivo_erro(msg: str) -> str:
    if msg.startswith("Variaveis obrigatorias nao encontradas:"):
        return "variaveis_obrigatorias_ausentes"
    if msg.startswith("Variavel obrigatoria nao encontrada:"):
        return "variavel_obrigatoria_ausente"
    if msg.startswith("Indicador nao numerico:"):
        return "indicador_nao_numerico"
    if msg.startswith("Indicador sem valor:"):
        return "indicador_sem_valor"
    if msg.startswith("Indicador com valor invalido:"):
        return "indicador_valor_invalido"
    if "deve ser maior que zero" in msg:
        return "divisor_ou_populacao_invalida"
    if msg.startswith("Valor nao numerico:"):
        return "valor_nao_numerico"
    return msg or "erro_desconhecido"


def _counter_top(counter: Counter, limite: int = 10) -> Dict[str, int]:
    itens = sorted(counter.items(), key=lambda x: (-x[1], x[0]))[:limite]
    return {chave: int(valor) for chave, valor in itens}


def _imprimir_progresso(
    indice_atual: int,
    total: int,
    municipio_cod_ibge: int,
    inicio_execucao: float,
) -> None:
    percentual = (indice_atual / total * 100.0) if total > 0 else 100.0
    tempo_decorrido = time.time() - inicio_execucao
    print(
        (
            f"[progresso] municipios {indice_atual}/{total} "
            f"({percentual:.1f}%) - cod_ibge={municipio_cod_ibge} "
            f"- {tempo_decorrido:.1f}s"
        ),
        flush=True,
    )


def calcular_indicadores_municipio(
    municipio_cod_ibge: int,
    variaveis_por_ano: Dict[int, Dict[str, float]],
    indicator_ids: List[str],
    siglas_por_indicador: Dict[str, Set[str]],
    existentes_bd: Optional[Set[Tuple[int, str]]] = None,
) -> Tuple[List[Dict[str, object]], int, int, int, Counter, Counter, Counter]:
    resultados: List[Dict[str, object]] = []
    erros_indicadores = 0
    indicadores_nao_numericos_ignorados = 0
    indicadores_ignorados_incremental = 0
    erros_por_indicador: Counter = Counter()
    variaveis_faltantes: Counter = Counter()
    motivos_erro: Counter = Counter()
    existentes_bd = existentes_bd or set()
    cross_year_indicator_ids = [
        indicator_id
        for indicator_id in indicator_ids
        if indicator_id in CROSS_YEAR_INDICATOR_IDS
    ]
    per_year_indicator_ids = [
        indicator_id
        for indicator_id in indicator_ids
        if indicator_id not in CROSS_YEAR_INDICATOR_IDS
    ]
    pop_tot_por_ano = {
        int(ano_variavel): float(variaveis_ano["POP_TOT"])
        for ano_variavel, variaveis_ano in variaveis_por_ano.items()
        if "POP_TOT" in variaveis_ano
    }

    for indicator_id in cross_year_indicator_ids:
        try:
            siglas_indicador = siglas_por_indicador[indicator_id]
            variaveis_combinadas: Dict[str, float] = {}
            anos_variaveis: Dict[str, int] = {}

            for ano, variaveis_ano in sorted(variaveis_por_ano.items()):
                for sigla in siglas_indicador:
                    if sigla in variaveis_ano:
                        variaveis_combinadas[sigla] = variaveis_ano[sigla]
                        anos_variaveis[sigla] = int(ano)

            if not variaveis_combinadas:
                continue

            ano_referencia = max(anos_variaveis.values())
            if (int(ano_referencia), str(indicator_id)) in existentes_bd:
                indicadores_ignorados_incremental += 1
                continue

            resultado = calculate_indicator(
                indicator_id,
                municipio_cod_ibge,
                variaveis_combinadas,
                variaveis_anos=anos_variaveis,
            )
            try:
                indicador_valor, indicador_texto, indicador_valor_textual = (
                    _extrair_valores_indicador(resultado)
                )
                resultado["indicador_valor"] = indicador_valor
                resultado["indicador_texto"] = indicador_texto
                resultado["indicador_valor_textual"] = indicador_valor_textual
            except ValueError as exc:
                indicadores_nao_numericos_ignorados += 1
                motivos_erro[_classificar_motivo_erro(str(exc))] += 1
                continue
            resultado["ano_referencia"] = int(ano_referencia)
            resultados.append(resultado)
        except Exception as exc:
            erros_indicadores += 1
            erros_por_indicador[str(indicator_id)] += 1
            msg = str(exc)
            motivos_erro[_classificar_motivo_erro(msg)] += 1
            for sigla in _extrair_variaveis_faltantes(msg):
                variaveis_faltantes[sigla] += 1

    for ano, variaveis_ano in sorted(variaveis_por_ano.items()):
        for indicator_id in per_year_indicator_ids:
            variaveis_calculo, anos_variaveis = _preparar_variaveis_indicador_por_ano(
                variaveis_ano,
                int(ano),
                siglas_por_indicador[indicator_id],
                pop_tot_por_ano,
                indicator_id in CALCULATE_WITH_ALL_VARIABLES_MISSING_IDS
                and int(ano) in CALCULATE_WITH_ALL_VARIABLES_MISSING_YEARS.get(indicator_id, set()),
            )
            if variaveis_calculo is None or anos_variaveis is None:
                continue

            if (int(ano), str(indicator_id)) in existentes_bd:
                indicadores_ignorados_incremental += 1
                continue

            try:
                resultado = calculate_indicator(
                    indicator_id,
                    municipio_cod_ibge,
                    variaveis_calculo,
                    variaveis_anos=anos_variaveis,
                )
                try:
                    indicador_valor, indicador_texto, indicador_valor_textual = (
                        _extrair_valores_indicador(resultado)
                    )
                    resultado["indicador_valor"] = indicador_valor
                    resultado["indicador_texto"] = indicador_texto
                    resultado["indicador_valor_textual"] = indicador_valor_textual
                except ValueError as exc:
                    indicadores_nao_numericos_ignorados += 1
                    motivos_erro[_classificar_motivo_erro(str(exc))] += 1
                    continue
                resultado["ano_referencia"] = int(ano)
                resultados.append(resultado)
            except Exception as exc:
                erros_indicadores += 1
                erros_por_indicador[str(indicator_id)] += 1
                msg = str(exc)
                motivos_erro[_classificar_motivo_erro(msg)] += 1
                for sigla in _extrair_variaveis_faltantes(msg):
                    variaveis_faltantes[sigla] += 1

    return (
        resultados,
        erros_indicadores,
        indicadores_nao_numericos_ignorados,
        indicadores_ignorados_incremental,
        erros_por_indicador,
        variaveis_faltantes,
        motivos_erro,
    )


def gravar_indicadores_stg(conn, resultados: List[Dict[str, object]]) -> Tuple[int, int]:
    if not resultados:
        return 0, 0

    query_upsert = """
        INSERT INTO stg.municipio_apresenta_indicador
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
                WHEN stg.municipio_apresenta_indicador.indicador_valor
                        IS DISTINCT FROM EXCLUDED.indicador_valor
                  OR stg.municipio_apresenta_indicador.texto
                        IS DISTINCT FROM EXCLUDED.texto
                  OR stg.municipio_apresenta_indicador.indicador_valor_textual
                        IS DISTINCT FROM EXCLUDED.indicador_valor_textual
                THEN NULL
                ELSE stg.municipio_apresenta_indicador.indicador_nivel
            END,
            topico_nivel = CASE
                WHEN stg.municipio_apresenta_indicador.indicador_valor
                        IS DISTINCT FROM EXCLUDED.indicador_valor
                  OR stg.municipio_apresenta_indicador.texto
                        IS DISTINCT FROM EXCLUDED.texto
                  OR stg.municipio_apresenta_indicador.indicador_valor_textual
                        IS DISTINCT FROM EXCLUDED.indicador_valor_textual
                THEN NULL
                ELSE stg.municipio_apresenta_indicador.topico_nivel
            END,
            dimensao_nivel = CASE
                WHEN stg.municipio_apresenta_indicador.indicador_valor
                        IS DISTINCT FROM EXCLUDED.indicador_valor
                  OR stg.municipio_apresenta_indicador.texto
                        IS DISTINCT FROM EXCLUDED.texto
                  OR stg.municipio_apresenta_indicador.indicador_valor_textual
                        IS DISTINCT FROM EXCLUDED.indicador_valor_textual
                THEN NULL
                ELSE stg.municipio_apresenta_indicador.dimensao_nivel
            END,
            municipio_nivel = CASE
                WHEN stg.municipio_apresenta_indicador.indicador_valor
                        IS DISTINCT FROM EXCLUDED.indicador_valor
                  OR stg.municipio_apresenta_indicador.texto
                        IS DISTINCT FROM EXCLUDED.texto
                  OR stg.municipio_apresenta_indicador.indicador_valor_textual
                        IS DISTINCT FROM EXCLUDED.indicador_valor_textual
                THEN NULL
                ELSE stg.municipio_apresenta_indicador.municipio_nivel
            END
    """

    cur = conn.cursor()
    inseridos = 0
    ignorados_sem_ano = 0
    valores: List[
        Tuple[int, int, int, Optional[float], Optional[str], Optional[str]]
    ] = []

    try:
        for resultado in resultados:
            municipio_cod_ibge = int(resultado["municipio_cod_ibge"])
            indicador_referencia = int(str(resultado["indicador_id"]))
            ano = _resolver_ano_indicador(resultado)

            if ano is None:
                ignorados_sem_ano += 1
                continue

            indicador_valor = resultado.get("indicador_valor")
            indicador_texto = resultado.get("indicador_texto")
            indicador_valor_textual = resultado.get("indicador_valor_textual")

            if indicador_valor is not None:
                indicador_valor = round(float(indicador_valor), 2)
            if indicador_texto is not None:
                indicador_texto = str(indicador_texto).strip() or None
            if indicador_valor_textual is not None:
                indicador_valor_textual = str(indicador_valor_textual).strip() or None

            valores.append(
                (
                    municipio_cod_ibge,
                    indicador_referencia,
                    ano,
                    indicador_valor,
                    indicador_texto,
                    indicador_valor_textual,
                )
            )

        if valores:
            execute_values(
                cur,
                query_upsert,
                valores,
                template="(%s, %s, %s, %s, %s, %s, NULL, NULL, NULL, NULL)",
                page_size=1000,
            )
            inseridos = len(valores)

        conn.commit()
        return inseridos, ignorados_sem_ano
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


def gravar_indicadores_stg_resiliente(
    conn,
    resultados: List[Dict[str, object]],
) -> Tuple[int, int, List[Dict[str, object]]]:
    try:
        gravadas, ignoradas = gravar_indicadores_stg(conn, resultados)
        return gravadas, ignoradas, []
    except Exception as exc:
        print(
            f"[aviso] falha no upsert em lote; tentando identificar linhas invalidas: {exc}",
            flush=True,
        )

    query_upsert_unitario = """
        INSERT INTO stg.municipio_apresenta_indicador
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
        VALUES (%s, %s, %s, %s, %s, %s, NULL, NULL, NULL, NULL)
        ON CONFLICT (municipio_cod_ibge, indicador_referencia, ano)
        DO UPDATE SET
            indicador_valor = EXCLUDED.indicador_valor,
            texto = EXCLUDED.texto,
            indicador_valor_textual = EXCLUDED.indicador_valor_textual,
            indicador_nivel = CASE
                WHEN stg.municipio_apresenta_indicador.indicador_valor
                        IS DISTINCT FROM EXCLUDED.indicador_valor
                  OR stg.municipio_apresenta_indicador.texto
                        IS DISTINCT FROM EXCLUDED.texto
                  OR stg.municipio_apresenta_indicador.indicador_valor_textual
                        IS DISTINCT FROM EXCLUDED.indicador_valor_textual
                THEN NULL
                ELSE stg.municipio_apresenta_indicador.indicador_nivel
            END,
            topico_nivel = CASE
                WHEN stg.municipio_apresenta_indicador.indicador_valor
                        IS DISTINCT FROM EXCLUDED.indicador_valor
                  OR stg.municipio_apresenta_indicador.texto
                        IS DISTINCT FROM EXCLUDED.texto
                  OR stg.municipio_apresenta_indicador.indicador_valor_textual
                        IS DISTINCT FROM EXCLUDED.indicador_valor_textual
                THEN NULL
                ELSE stg.municipio_apresenta_indicador.topico_nivel
            END,
            dimensao_nivel = CASE
                WHEN stg.municipio_apresenta_indicador.indicador_valor
                        IS DISTINCT FROM EXCLUDED.indicador_valor
                  OR stg.municipio_apresenta_indicador.texto
                        IS DISTINCT FROM EXCLUDED.texto
                  OR stg.municipio_apresenta_indicador.indicador_valor_textual
                        IS DISTINCT FROM EXCLUDED.indicador_valor_textual
                THEN NULL
                ELSE stg.municipio_apresenta_indicador.dimensao_nivel
            END,
            municipio_nivel = CASE
                WHEN stg.municipio_apresenta_indicador.indicador_valor
                        IS DISTINCT FROM EXCLUDED.indicador_valor
                  OR stg.municipio_apresenta_indicador.texto
                        IS DISTINCT FROM EXCLUDED.texto
                  OR stg.municipio_apresenta_indicador.indicador_valor_textual
                        IS DISTINCT FROM EXCLUDED.indicador_valor_textual
                THEN NULL
                ELSE stg.municipio_apresenta_indicador.municipio_nivel
            END
    """

    cur = conn.cursor()
    gravadas = 0
    ignoradas = 0
    falhas: List[Dict[str, object]] = []
    try:
        for resultado in resultados:
            municipio_cod_ibge = int(resultado["municipio_cod_ibge"])
            indicador_referencia = int(str(resultado["indicador_id"]))
            ano = _resolver_ano_indicador(resultado)

            if ano is None:
                ignoradas += 1
                continue

            try:
                indicador_valor = resultado.get("indicador_valor")
                indicador_texto = resultado.get("indicador_texto")
                indicador_valor_textual = resultado.get("indicador_valor_textual")

                if indicador_valor is not None:
                    indicador_valor = round(float(indicador_valor), 2)
                if indicador_texto is not None:
                    indicador_texto = str(indicador_texto).strip() or None
                if indicador_valor_textual is not None:
                    indicador_valor_textual = str(indicador_valor_textual).strip() or None

                cur.execute(
                    query_upsert_unitario,
                    (
                        municipio_cod_ibge,
                        indicador_referencia,
                        ano,
                        indicador_valor,
                        indicador_texto,
                        indicador_valor_textual,
                    ),
                )
                conn.commit()
                gravadas += 1
            except Exception as row_exc:
                conn.rollback()
                falhas.append(
                    {
                        "municipio_cod_ibge": municipio_cod_ibge,
                        "indicador_referencia": indicador_referencia,
                        "ano": int(ano),
                        "indicador_valor": indicador_valor,
                        "indicador_texto": indicador_texto,
                        "indicador_valor_textual": indicador_valor_textual,
                        "erro": str(row_exc),
                    }
                )
    finally:
        cur.close()

    return gravadas, ignoradas, falhas


def processar_municipio(
    cfg: Dict[str, object],
    municipio_cod_ibge: int,
    siglas: List[str],
    indicator_ids: List[str],
    siglas_por_indicador: Dict[str, Set[str]],
    recalcular_todos: bool,
) -> Dict[str, object]:
    conn_municipio = get_connection(**cfg)
    try:
        variaveis_por_ano = buscar_variaveis_municipio_por_ano(
            conn_municipio,
            municipio_cod_ibge,
            siglas,
        )
        existentes_bd = set()
        if not recalcular_todos:
            existentes_bd = buscar_indicadores_existentes_bd(
                conn_municipio,
                municipio_cod_ibge,
                sorted(variaveis_por_ano.keys()),
                indicator_ids,
            )
        (
            resultados,
            erros_indicadores,
            indicadores_nao_numericos_ignorados,
            indicadores_ignorados_incremental,
            erros_por_indicador,
            variaveis_faltantes,
            motivos_erro,
        ) = calcular_indicadores_municipio(
            municipio_cod_ibge,
            variaveis_por_ano,
            indicator_ids,
            siglas_por_indicador,
            existentes_bd,
        )
        gravadas, ignoradas, falhas_gravacao = gravar_indicadores_stg_resiliente(
            conn_municipio, resultados
        )
        if falhas_gravacao:
            print(
                (
                    f"[aviso] municipio {municipio_cod_ibge}: "
                    f"{len(falhas_gravacao)} falha(s) de gravacao em stg"
                ),
                flush=True,
            )
            for falha in falhas_gravacao[:10]:
                print(
                    (
                        "[aviso] "
                        f"municipio={falha['municipio_cod_ibge']} "
                        f"indicador={falha['indicador_referencia']} "
                        f"ano={falha['ano']} "
                        f"valor={falha['indicador_valor']} "
                        f"erro={falha['erro']}"
                    ),
                    flush=True,
                )
        return {
            "municipio_cod_ibge": int(municipio_cod_ibge),
            "erro_municipio": False,
            "indicadores_calculados": int(len(resultados)),
            "indicadores_com_erro": int(erros_indicadores),
            "indicadores_nao_numericos_ignorados": int(indicadores_nao_numericos_ignorados),
            "indicadores_ignorados_incremental": int(indicadores_ignorados_incremental),
            "linhas_gravadas_stg": int(gravadas),
            "linhas_ignoradas_sem_ano": int(ignoradas),
            "falhas_gravacao_stg": int(len(falhas_gravacao)),
            "erros_por_indicador": erros_por_indicador,
            "variaveis_faltantes": variaveis_faltantes,
            "motivos_erro": motivos_erro,
        }
    except Exception as exc:
        print(
            f"[erro] municipio {municipio_cod_ibge}: falha inesperada no processamento: {exc}",
            flush=True,
        )
        return {
            "municipio_cod_ibge": int(municipio_cod_ibge),
            "erro_municipio": True,
            "indicadores_calculados": 0,
            "indicadores_com_erro": 0,
            "indicadores_nao_numericos_ignorados": 0,
            "indicadores_ignorados_incremental": 0,
            "linhas_gravadas_stg": 0,
            "linhas_ignoradas_sem_ano": 0,
            "falhas_gravacao_stg": 0,
            "erros_por_indicador": Counter(),
            "variaveis_faltantes": Counter(),
            "motivos_erro": Counter(),
        }
    finally:
        conn_municipio.close()


def _anos_com_particao_bd(conn) -> List[int]:
    rows = execute_query(
        conn,
        """
        SELECT pg_get_expr(c.relpartbound, c.oid) AS partition_bound
        FROM pg_class c
        JOIN pg_inherits i ON i.inhrelid = c.oid
        JOIN pg_class p ON p.oid = i.inhparent
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_namespace np ON np.oid = p.relnamespace
        WHERE np.nspname = 'bd'
          AND p.relname = 'municipio_apresenta_indicador'
        ORDER BY c.relname
        """,
        return_data=True,
    )

    anos: List[int] = []
    pattern = re.compile(r"FROM \((\d+)\) TO \((\d+)\)")
    for (partition_bound,) in rows:
        if not partition_bound:
            continue
        match = pattern.search(str(partition_bound))
        if not match:
            continue
        ano_inicio = int(match.group(1))
        ano_fim = int(match.group(2))
        anos.extend(range(ano_inicio, ano_fim))

    return sorted(set(anos))


def promover_stg_para_bd(conn, municipio_cod_ibge: Optional[int] = None) -> int:
    anos_validos = _anos_com_particao_bd(conn)
    if not anos_validos:
        print(
            "[aviso] nenhuma particao encontrada em bd.municipio_apresenta_indicador; promocao ignorada",
            flush=True,
        )
        return 0

    anos_validos_set = set(anos_validos)
    params_list: List[object] = [anos_validos]
    skipped_params: List[object] = [anos_validos]
    skipped_where_clause = "WHERE ano IS NOT NULL AND NOT (ano = ANY(%s))"
    where_clause = """
        WHERE f.ano = ANY(%s)
          AND (
            atual.municipio_cod_ibge IS NULL
            OR f.indicador_valor IS DISTINCT FROM atual.indicador_valor
            OR f.texto IS DISTINCT FROM atual.texto
            OR f.indicador_valor_textual IS DISTINCT FROM atual.indicador_valor_textual
        )
    """

    if municipio_cod_ibge is not None:
        where_clause = """
        WHERE f.municipio_cod_ibge = %s
          AND f.ano = ANY(%s)
          AND (
              atual.municipio_cod_ibge IS NULL
              OR f.indicador_valor IS DISTINCT FROM atual.indicador_valor
              OR f.texto IS DISTINCT FROM atual.texto
              OR f.indicador_valor_textual IS DISTINCT FROM atual.indicador_valor_textual
          )
        """
        params_list = [municipio_cod_ibge, anos_validos]
        skipped_where_clause = """
        WHERE municipio_cod_ibge = %s
          AND ano IS NOT NULL
          AND NOT (ano = ANY(%s))
        """
        skipped_params = [municipio_cod_ibge, anos_validos]

    skipped_rows = execute_query(
        conn,
        f"""
        SELECT ano, COUNT(*)
        FROM stg.municipio_apresenta_indicador
        {skipped_where_clause}
        GROUP BY ano
        ORDER BY ano
        """,
        tuple(skipped_params),
        return_data=True,
    )
    if skipped_rows:
        total_ignoradas = sum(int(total) for _, total in skipped_rows)
        anos_ignorados = ", ".join(str(int(ano)) for ano, _ in skipped_rows[:10])
        complemento = "..." if len(skipped_rows) > 10 else ""
        print(
            (
                f"[aviso] promocao para bd ignorou {total_ignoradas} linha(s) "
                f"sem particao de ano correspondente em bd.municipio_apresenta_indicador "
                f"(anos: {anos_ignorados}{complemento})"
            ),
            flush=True,
        )

    query = f"""
        INSERT INTO bd.municipio_apresenta_indicador
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
        SELECT
            m.municipio_cod_ibge,
            i.indicador_referencia,
            f.ano,
            CASE
                WHEN f.indicador_valor IS NULL
                  AND (f.texto IS NOT NULL OR f.indicador_valor_textual IS NOT NULL)
                THEN 0
                WHEN f.indicador_valor IS NULL THEN NULL
                ELSE ROUND(f.indicador_valor::numeric, 2)
            END AS indicador_valor,
            f.texto,
            f.indicador_valor_textual,
            NULL AS indicador_nivel,
            NULL AS topico_nivel,
            NULL AS dimensao_nivel,
            NULL AS municipio_nivel
        FROM stg.municipio_apresenta_indicador f
        JOIN bd.municipio m
            ON m.municipio_cod_ibge = f.municipio_cod_ibge
        JOIN bd.indicador i
            ON i.indicador_referencia = f.indicador_referencia
        LEFT JOIN bd.municipio_apresenta_indicador atual
            ON atual.municipio_cod_ibge = f.municipio_cod_ibge
           AND atual.indicador_referencia = f.indicador_referencia
           AND atual.ano = f.ano
        {where_clause}
        ON CONFLICT (municipio_cod_ibge, indicador_referencia, ano)
        DO UPDATE SET
            indicador_valor = CASE
                WHEN EXCLUDED.indicador_valor IS NULL
                  AND (
                    EXCLUDED.texto IS NOT NULL
                    OR EXCLUDED.indicador_valor_textual IS NOT NULL
                  )
                THEN 0
                WHEN EXCLUDED.indicador_valor IS NULL THEN NULL
                ELSE ROUND(EXCLUDED.indicador_valor::numeric, 2)
            END,
            texto = EXCLUDED.texto,
            indicador_valor_textual = EXCLUDED.indicador_valor_textual,
            indicador_nivel = NULL,
            topico_nivel = NULL,
            dimensao_nivel = NULL,
            municipio_nivel = NULL
        RETURNING 1
    """

    rows = execute_query(conn, query, tuple(params_list), return_data=True)
    return len(rows)


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Calcula indicadores em Python para todos os municipios (ou um municipio especifico), "
            "grava em stg.municipio_apresenta_indicador e promove para bd.municipio_apresenta_indicador."
        )
    )
    parser.add_argument(
        "--municipio",
        type=int,
        required=False,
        help="Codigo IBGE do municipio (opcional). Se omitido, processa todos.",
    )
    parser.add_argument(
        "--indicadores",
        nargs="*",
        help="IDs de indicadores especificos. Se omitido, calcula todos os mapeados.",
    )
    parser.add_argument(
        "--nao-promover-bd",
        action="store_true",
        help="Nao promove para bd ao final (mantem somente em staging).",
    )
    parser.add_argument(
        "--recalcular-todos",
        action="store_true",
        help=(
            "Recalcula mesmo indicadores que ja existem em bd. Use quando os dados de origem "
            "foram alterados e voce quer atualizar valores ja calculados."
        ),
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=4,
        help="Quantidade de workers para processar municipios em paralelo (padrao: 4).",
    )
    args = parser.parse_args()

    indicator_ids = args.indicadores if args.indicadores else list_indicator_ids()
    siglas_por_indicador: Dict[str, Set[str]] = {
        indicator_id: set(INDICATOR_SPECS[indicator_id].siglas)
        for indicator_id in indicator_ids
    }

    cfg = carregar_config()
    conn = get_connection(**cfg)
    try:
        municipios = [args.municipio] if args.municipio is not None else listar_municipios(conn)
        siglas = required_siglas(indicator_ids)
        inicio_execucao = time.time()

        total_municipios = len(municipios)
        total_indicadores_calculados = 0
        total_indicadores_com_erro = 0
        total_indicadores_nao_numericos_ignorados = 0
        total_indicadores_ignorados_incremental = 0
        total_linhas_gravadas_stg = 0
        total_linhas_ignoradas_sem_ano = 0
        total_falhas_gravacao_stg = 0
        erros_municipios = 0
        erros_por_indicador_total: Counter = Counter()
        variaveis_faltantes_total: Counter = Counter()
        motivos_erro_total: Counter = Counter()

        max_workers = max(1, int(args.workers))
        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            futures = [
                executor.submit(
                    processar_municipio,
                    cfg,
                    int(municipio_cod_ibge),
                    siglas,
                    indicator_ids,
                    siglas_por_indicador,
                    bool(args.recalcular_todos),
                )
                for municipio_cod_ibge in municipios
            ]

            for indice, future in enumerate(as_completed(futures), start=1):
                resultado_municipio = future.result()
                _imprimir_progresso(
                    indice,
                    total_municipios,
                    int(resultado_municipio["municipio_cod_ibge"]),
                    inicio_execucao,
                )

                if bool(resultado_municipio["erro_municipio"]):
                    erros_municipios += 1
                    continue

                total_indicadores_calculados += int(resultado_municipio["indicadores_calculados"])
                total_indicadores_com_erro += int(resultado_municipio["indicadores_com_erro"])
                total_indicadores_nao_numericos_ignorados += int(
                    resultado_municipio["indicadores_nao_numericos_ignorados"]
                )
                total_indicadores_ignorados_incremental += int(
                    resultado_municipio["indicadores_ignorados_incremental"]
                )
                total_linhas_gravadas_stg += int(resultado_municipio["linhas_gravadas_stg"])
                total_linhas_ignoradas_sem_ano += int(
                    resultado_municipio["linhas_ignoradas_sem_ano"]
                )
                total_falhas_gravacao_stg += int(resultado_municipio["falhas_gravacao_stg"])
                erros_por_indicador_total.update(resultado_municipio["erros_por_indicador"])
                variaveis_faltantes_total.update(resultado_municipio["variaveis_faltantes"])
                motivos_erro_total.update(resultado_municipio["motivos_erro"])

        total_linhas_promovidas_bd = 0
        if not args.nao_promover_bd:
            if total_linhas_gravadas_stg == 0:
                print(
                    "[progresso] promocao ignorada - nenhuma linha nova gravada em stg",
                    flush=True,
                )
            else:
                print("[progresso] promovendo dados de stg para bd...", flush=True)
                total_linhas_promovidas_bd = promover_stg_para_bd(conn, args.municipio)
                print(
                    f"[progresso] promocao concluida - linhas afetadas: {total_linhas_promovidas_bd}",
                    flush=True,
                )

        print(
            json.dumps(
                {
                    "total_municipios_processados": total_municipios,
                    "total_municipios_com_erro": erros_municipios,
                    "total_indicadores_calculados": total_indicadores_calculados,
                    "total_indicadores_com_erro": total_indicadores_com_erro,
                    "total_indicadores_nao_numericos_ignorados": total_indicadores_nao_numericos_ignorados,
                    "total_indicadores_ignorados_incremental": total_indicadores_ignorados_incremental,
                    "total_linhas_gravadas_stg": total_linhas_gravadas_stg,
                    "total_linhas_ignoradas_sem_ano": total_linhas_ignoradas_sem_ano,
                    "total_falhas_gravacao_stg": total_falhas_gravacao_stg,
                    "total_linhas_promovidas_bd": total_linhas_promovidas_bd,
                    "diagnostico_erros": {
                        "top_indicadores_com_erro": _counter_top(erros_por_indicador_total),
                        "top_variaveis_faltantes": _counter_top(variaveis_faltantes_total),
                        "top_motivos_erro": _counter_top(motivos_erro_total),
                    },
                },
                ensure_ascii=False,
                indent=2,
            )
        )
    finally:
        conn.close()


if __name__ == "__main__":
    main()
