from __future__ import annotations

from typing import Optional

from indicadores.core.types import Number


def calcular(
    ind: Number,
    conn=None,
    municipio_cod_ibge: Optional[int] = None,
    ano: Optional[int] = None,
) -> Optional[int]:
    if ind < 0:
        raise ValueError("Indicador 3113 invalido (< 0)")

    if ind == 0:
        return 1
    if ind == 1:
        return 2
    if ind == 2:
        return 3
    if ind == 3:
        return 4
    if ind == 4:
        nivel_3056 = _buscar_nivel_3056(conn, municipio_cod_ibge, ano)
        if nivel_3056 is None:
            return 5
        if nivel_3056 < 5:
            return 5
        if nivel_3056 > 7:
            return 7
        return nivel_3056
    return None


def _buscar_nivel_3056(
    conn,
    municipio_cod_ibge: Optional[int],
    ano: Optional[int],
) -> Optional[int]:
    if conn is None or municipio_cod_ibge is None or ano is None:
        return None

    query = """
        SELECT indicador_valor, indicador_nivel
        FROM stg.municipio_apresenta_indicador
        WHERE municipio_cod_ibge = %s
          AND ano = %s
          AND indicador_referencia = 3056
        LIMIT 1
    """

    cur = conn.cursor()
    try:
        cur.execute(query, (municipio_cod_ibge, ano))
        row = cur.fetchone()
    finally:
        cur.close()

    if not row:
        return None

    indicador_valor, indicador_nivel = row
    if indicador_nivel is not None:
        return int(indicador_nivel)
    if indicador_valor is None:
        return None

    from indicadores import calcular_nivel_maturidade

    nivel_calculado = calcular_nivel_maturidade("3056", float(indicador_valor))
    if nivel_calculado is None:
        return None
    return int(nivel_calculado)
