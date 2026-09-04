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
        raise ValueError("Indicador 3057 invalido (< 0)")

    if ind <= 1:
        return 1
    if ind == 2:
        return 2
    if ind == 3:
        return 3

    if ind == 4:
        nivel_base = 4
        nivel_4030 = _buscar_nivel_4030(conn, municipio_cod_ibge, ano)
        if nivel_4030 is None:
            return nivel_base
        if nivel_4030 < 4:
            return 4
        if nivel_4030 > 5:
            return 5
        return nivel_4030

    if ind == 5:
        nivel_base = 6
        nivel_4030 = _buscar_nivel_4030(conn, municipio_cod_ibge, ano)
        if nivel_4030 is None:
            return nivel_base
        if nivel_4030 < 6:
            return 6
        if nivel_4030 > 7:
            return 7
        return nivel_4030

    return None


def _buscar_nivel_4030(
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
          AND indicador_referencia = 4030
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

    nivel_calculado = calcular_nivel_maturidade("4030", float(indicador_valor))
    if nivel_calculado is None:
        return None
    return int(nivel_calculado)
