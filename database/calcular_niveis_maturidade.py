import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import json
import os
import re
import time
from collections import defaultdict
from pathlib import Path
from typing import Dict, Iterable, List, Optional, Tuple

from dotenv import load_dotenv
from psycopg2.extras import execute_values

from conexao_consulta import execute_query, get_connection
from indicadores import MATURITY_RULES, calcular_nivel_maturidade


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


def buscar_indicadores_para_processar(
    conn,
    maturity_indicator_ids: List[int],
    municipio_cod_ibge: Optional[int] = None,
) -> List[Tuple[int, int, int, float]]:
    if not maturity_indicator_ids:
        return []

    where_clause = ""
    params: List[object] = [maturity_indicator_ids]

    if municipio_cod_ibge is not None:
        where_clause = " AND s.municipio_cod_ibge = %s"
        params.append(municipio_cod_ibge)

    query = f"""
        SELECT
            s.municipio_cod_ibge,
            s.indicador_referencia,
            s.ano,
            s.indicador_valor
        FROM stg.municipio_apresenta_indicador s
        LEFT JOIN bd.municipio_apresenta_indicador b
            ON b.municipio_cod_ibge = s.municipio_cod_ibge
           AND b.indicador_referencia = s.indicador_referencia
           AND b.ano = s.ano
        WHERE s.indicador_valor IS NOT NULL
          AND s.indicador_referencia = ANY(%s)
          {where_clause}
          AND (
              b.municipio_cod_ibge IS NULL
              OR s.indicador_valor IS DISTINCT FROM b.indicador_valor
              OR b.indicador_nivel IS NULL
          )
        ORDER BY s.municipio_cod_ibge, s.indicador_referencia, s.ano
    """

    return execute_query(conn, query, tuple(params), return_data=True)


def carregar_contexto_maturidade(
    conn, municipio_cod_ibge: int
) -> Dict[Tuple[int, int], Dict[str, Optional[float]]]:
    query = """
        SELECT
            ano,
            indicador_referencia,
            indicador_valor,
            indicador_nivel
        FROM stg.municipio_apresenta_indicador
        WHERE municipio_cod_ibge = %s
    """
    rows = execute_query(conn, query, (municipio_cod_ibge,), return_data=True)
    contexto: Dict[Tuple[int, int], Dict[str, Optional[float]]] = {}
    for ano, indicador_referencia, indicador_valor, indicador_nivel in rows:
        contexto[(int(ano), int(indicador_referencia))] = {
            "indicador_valor": None if indicador_valor is None else float(indicador_valor),
            "indicador_nivel": None if indicador_nivel is None else float(indicador_nivel),
        }
    return contexto


def _emitir_progresso(
    prefixo: str,
    atual: int,
    total: int,
    inicio_execucao: float,
    detalhe: Optional[str] = None,
) -> None:
    percentual = (atual / total * 100.0) if total > 0 else 100.0
    tempo_decorrido = time.time() - inicio_execucao
    detalhe_fmt = f" - {detalhe}" if detalhe else ""
    print(
        f"[progresso] {prefixo}: {atual}/{total} ({percentual:.1f}%){detalhe_fmt} - {tempo_decorrido:.1f}s",
        flush=True,
    )


class CachedMaturityCursor:
    _QUERY_ANY_RE = re.compile(
        r"FROM\s+stg\.municipio_apresenta_indicador.*?"
        r"WHERE\s+municipio_cod_ibge\s*=\s*%s.*?"
        r"AND\s+ano\s*=\s*%s.*?"
        r"AND\s+indicador_referencia\s*=\s*ANY\(%s\)",
        re.IGNORECASE | re.DOTALL,
    )
    _QUERY_SINGLE_RE = re.compile(
        r"FROM\s+stg\.municipio_apresenta_indicador.*?"
        r"WHERE\s+municipio_cod_ibge\s*=\s*%s.*?"
        r"AND\s+ano\s*=\s*%s.*?"
        r"AND\s+indicador_referencia\s*=\s*(\d+)\s+LIMIT\s+1",
        re.IGNORECASE | re.DOTALL,
    )

    def __init__(self, conn_wrapper: "CachedMaturityConnection"):
        self._conn_wrapper = conn_wrapper
        self._fallback_cursor = None
        self._results: List[Tuple[object, ...]] = []

    def execute(self, query: str, params=None) -> None:
        self._results = []
        if self._try_execute_from_cache(query, params):
            return

        self._fallback_cursor = self._conn_wrapper._conn.cursor()
        if params:
            self._fallback_cursor.execute(query, params)
        else:
            self._fallback_cursor.execute(query)

    def fetchall(self) -> List[Tuple[object, ...]]:
        if self._fallback_cursor is not None:
            return self._fallback_cursor.fetchall()
        return list(self._results)

    def fetchone(self) -> Optional[Tuple[object, ...]]:
        if self._fallback_cursor is not None:
            return self._fallback_cursor.fetchone()
        if not self._results:
            return None
        return self._results[0]

    def close(self) -> None:
        if self._fallback_cursor is not None:
            self._fallback_cursor.close()
            self._fallback_cursor = None

    def _try_execute_from_cache(self, query: str, params) -> bool:
        normalized = " ".join(query.split())
        any_match = self._QUERY_ANY_RE.search(normalized)
        if any_match and params and len(params) == 3:
            _, ano, refs = params
            ano_int = int(ano)
            resultados: List[Tuple[object, ...]] = []
            for indicador_referencia in refs:
                registro = self._conn_wrapper.get_cached_row(ano_int, int(indicador_referencia))
                if registro is None:
                    continue
                resultados.append(
                    (
                        int(indicador_referencia),
                        registro["indicador_valor"],
                        registro["indicador_nivel"],
                    )
                )
            self._results = resultados
            return True

        single_match = self._QUERY_SINGLE_RE.search(normalized)
        if single_match and params and len(params) == 2:
            _, ano = params
            ano_int = int(ano)
            indicador_referencia = int(single_match.group(1))
            registro = self._conn_wrapper.get_cached_row(ano_int, indicador_referencia)
            if registro is None:
                self._results = []
            else:
                self._results = [
                    (
                        registro["indicador_valor"],
                        registro["indicador_nivel"],
                    )
                ]
            return True

        return False


class CachedMaturityConnection:
    def __init__(
        self,
        conn,
        municipio_cod_ibge: int,
        contexto: Dict[Tuple[int, int], Dict[str, Optional[float]]],
    ):
        self._conn = conn
        self._municipio_cod_ibge = int(municipio_cod_ibge)
        self._contexto = contexto

    def cursor(self) -> CachedMaturityCursor:
        return CachedMaturityCursor(self)

    def get_cached_row(
        self, ano: int, indicador_referencia: int
    ) -> Optional[Dict[str, Optional[float]]]:
        return self._contexto.get((int(ano), int(indicador_referencia)))

    def atualizar_nivel(self, ano: int, indicador_referencia: int, indicador_nivel: int) -> None:
        chave = (int(ano), int(indicador_referencia))
        registro = self._contexto.setdefault(
            chave,
            {
                "indicador_valor": None,
                "indicador_nivel": None,
            },
        )
        registro["indicador_nivel"] = float(indicador_nivel)

    def __getattr__(self, item):
        return getattr(self._conn, item)


def atualizar_niveis_indicador_em_lote(
    conn, atualizacoes: Iterable[Tuple[int, int, int, int]]
) -> int:
    valores = list(atualizacoes)
    if not valores:
        return 0

    query = """
        UPDATE stg.municipio_apresenta_indicador AS destino
        SET indicador_nivel = origem.indicador_nivel
        FROM (VALUES %s) AS origem(
            municipio_cod_ibge,
            indicador_referencia,
            ano,
            indicador_nivel
        )
        WHERE destino.municipio_cod_ibge = origem.municipio_cod_ibge
          AND destino.indicador_referencia = origem.indicador_referencia
          AND destino.ano = origem.ano
    """

    cur = conn.cursor()
    try:
        execute_values(
            cur,
            query,
            valores,
            template="(%s, %s, %s, %s)",
            page_size=1000,
        )
        conn.commit()
        return len(valores)
    except Exception:
        conn.rollback()
        raise
    finally:
        cur.close()


def _resolver_nivel_indicador(
    conn,
    municipio_cod_ibge: int,
    indicador_referencia: int,
    ano: int,
    indicador_valor: float,
) -> Optional[int]:
    return calcular_nivel_maturidade(
        str(indicador_referencia),
        float(indicador_valor),
        conn=conn,
        municipio_cod_ibge=int(municipio_cod_ibge),
        ano=int(ano),
    )


def _agrupar_rows_por_municipio(
    rows: Iterable[Tuple[int, int, int, float]]
) -> Dict[int, List[Tuple[int, int, int, float]]]:
    agrupados: Dict[int, List[Tuple[int, int, int, float]]] = defaultdict(list)
    for cod_ibge, indicador_ref, ano, indicador_valor in rows:
        agrupados[int(cod_ibge)].append(
            (int(cod_ibge), int(indicador_ref), int(ano), float(indicador_valor))
        )
    return dict(agrupados)


def processar_municipio_niveis(
    cfg: Dict[str, object],
    municipio_cod_ibge: int,
    rows_municipio: List[Tuple[int, int, int, float]],
) -> Dict[str, int]:
    conn_municipio = get_connection(**cfg)
    try:
        contexto = carregar_contexto_maturidade(conn_municipio, municipio_cod_ibge)
        conn_cache = CachedMaturityConnection(conn_municipio, municipio_cod_ibge, contexto)

        total_lidos = len(rows_municipio)
        total_sem_regra = 0
        atualizacoes: List[Tuple[int, int, int, int]] = []

        for cod_ibge, indicador_ref, ano, indicador_valor in rows_municipio:
            nivel = _resolver_nivel_indicador(
                conn_cache,
                int(cod_ibge),
                int(indicador_ref),
                int(ano),
                float(indicador_valor),
            )

            if nivel is None:
                total_sem_regra += 1
                continue

            nivel_int = int(nivel)
            atualizacoes.append((int(cod_ibge), int(indicador_ref), int(ano), nivel_int))
            conn_cache.atualizar_nivel(int(ano), int(indicador_ref), nivel_int)

        total_atualizados = atualizar_niveis_indicador_em_lote(conn_municipio, atualizacoes)
        return {
            "municipio_cod_ibge": int(municipio_cod_ibge),
            "total_lidos": total_lidos,
            "total_atualizados": total_atualizados,
            "total_sem_regra": total_sem_regra,
        }
    finally:
        conn_municipio.close()


def processar_niveis(
    conn,
    cfg: Dict[str, object],
    municipio_cod_ibge: Optional[int] = None,
    workers: int = 4,
) -> Dict[str, int]:
    maturity_indicator_ids = sorted(int(indicator_id) for indicator_id in MATURITY_RULES.keys())
    inicio_execucao = time.time()
    print(
        (
            "[progresso] buscando indicadores pendentes de maturidade "
            f"({len(maturity_indicator_ids)} indicadores com regra)..."
        ),
        flush=True,
    )
    rows = buscar_indicadores_para_processar(conn, maturity_indicator_ids, municipio_cod_ibge)
    print(
        (
            f"[progresso] busca de pendencias concluida - "
            f"{len(rows)} linha(s) encontradas - {time.time() - inicio_execucao:.1f}s"
        ),
        flush=True,
    )

    print("[progresso] agrupando pendencias por municipio...", flush=True)
    rows_por_municipio = _agrupar_rows_por_municipio(rows)

    total_lidos = len(rows)
    total_atualizados = 0
    total_sem_regra = 0
    total_municipios = len(rows_por_municipio)
    print(
        (
            f"[progresso] maturidade preparada - municipios={total_municipios} "
            f"linhas={total_lidos} workers={max(1, int(workers))}"
        ),
        flush=True,
    )

    if not rows_por_municipio:
        return {
            "total_lidos": 0,
            "total_atualizados": 0,
            "total_sem_regra": 0,
            "total_municipios_processados": 0,
        }

    max_workers = max(1, int(workers))
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = [
            executor.submit(processar_municipio_niveis, cfg, cod_ibge, rows_municipio)
            for cod_ibge, rows_municipio in rows_por_municipio.items()
        ]

        for indice, future in enumerate(as_completed(futures), start=1):
            resultado = future.result()
            detalhe = (
                f"cod_ibge={resultado['municipio_cod_ibge']} "
                f"lidos={resultado['total_lidos']} "
                f"atualizados={resultado['total_atualizados']} "
                f"sem_regra={resultado['total_sem_regra']}"
            )
            _emitir_progresso("maturidade", indice, total_municipios, inicio_execucao, detalhe)
            total_atualizados += int(resultado["total_atualizados"])
            total_sem_regra += int(resultado["total_sem_regra"])

    return {
        "total_lidos": total_lidos,
        "total_atualizados": total_atualizados,
        "total_sem_regra": total_sem_regra,
        "total_municipios_processados": total_municipios,
    }


def promover_stg_para_bd(
    conn,
    maturity_indicator_ids: List[int],
    municipio_cod_ibge: Optional[int] = None,
) -> int:
    if not maturity_indicator_ids:
        return 0

    where_clause = """
        WHERE f.indicador_referencia = ANY(%s)
          AND (
            atual.municipio_cod_ibge IS NULL
            OR f.indicador_valor IS DISTINCT FROM atual.indicador_valor
            OR (
                f.indicador_nivel IS NOT NULL
                AND f.indicador_nivel IS DISTINCT FROM atual.indicador_nivel
            )
        )
    """
    params: List[object] = [maturity_indicator_ids]

    if municipio_cod_ibge is not None:
        where_clause = """
        WHERE f.municipio_cod_ibge = %s
          AND f.indicador_referencia = ANY(%s)
          AND (
              atual.municipio_cod_ibge IS NULL
              OR f.indicador_valor IS DISTINCT FROM atual.indicador_valor
              OR (
                  f.indicador_nivel IS NOT NULL
                  AND f.indicador_nivel IS DISTINCT FROM atual.indicador_nivel
              )
          )
        """
        params = [municipio_cod_ibge, maturity_indicator_ids]

    query = f"""
        INSERT INTO bd.municipio_apresenta_indicador
        (
            municipio_cod_ibge,
            indicador_referencia,
            ano,
            indicador_valor,
            indicador_nivel,
            topico_nivel,
            dimensao_nivel,
            municipio_nivel
        )
        SELECT
            m.municipio_cod_ibge,
            i.indicador_referencia,
            f.ano,
            f.indicador_valor,
            f.indicador_nivel,
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
            indicador_valor = EXCLUDED.indicador_valor,
            indicador_nivel = EXCLUDED.indicador_nivel,
            topico_nivel = NULL,
            dimensao_nivel = NULL,
            municipio_nivel = NULL
        RETURNING 1
    """

    rows = execute_query(conn, query, tuple(params), return_data=True)
    return len(rows)


def main() -> None:
    parser = argparse.ArgumentParser(
        description=(
            "Calcula e grava indicador_nivel em stg.municipio_apresenta_indicador "
            "a partir de indicador_valor e indicador_referencia para todos os municipios "
            "(ou um municipio especifico)."
        )
    )
    parser.add_argument(
        "--municipio",
        type=int,
        required=False,
        help="Codigo IBGE do municipio para processar apenas um municipio (opcional).",
    )
    parser.add_argument(
        "--nao-promover-bd",
        action="store_true",
        help="Nao promove para bd ao final (mantem apenas atualizacao no staging).",
    )
    parser.add_argument(
        "--workers",
        type=int,
        default=4,
        help="Quantidade de workers para processar municipios em paralelo (padrao: 4).",
    )
    args = parser.parse_args()

    cfg = carregar_config()
    conn = get_connection(**cfg)
    try:
        maturity_indicator_ids = sorted(int(indicator_id) for indicator_id in MATURITY_RULES.keys())
        resumo = processar_niveis(conn, cfg, args.municipio, args.workers)
        if not args.nao_promover_bd:
            print("[progresso] promovendo maturidade de stg para bd...", flush=True)
            resumo["total_linhas_promovidas_bd"] = promover_stg_para_bd(
                conn,
                maturity_indicator_ids,
                args.municipio,
            )
            print(
                f"[progresso] promocao maturidade concluida - linhas afetadas: {resumo['total_linhas_promovidas_bd']}",
                flush=True,
            )
        else:
            resumo["total_linhas_promovidas_bd"] = 0
        print(json.dumps(resumo, ensure_ascii=False, indent=2))
    finally:
        conn.close()


if __name__ == "__main__":
    main()
