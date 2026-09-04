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
        raise ValueError("Indicador 6021 invalido (< 0)")

    if ind == 0:
        nivel_6024 = _buscar_nivel_6024(conn, municipio_cod_ibge, ano)
        if nivel_6024 is None:
            return 1
        if nivel_6024 < 1:
            return 1
        if nivel_6024 > 2:
            return 2
        return nivel_6024

    if ind == 1:
        return 3
    if ind == 2:
        return 4
    if ind == 3:
        return 5
    if ind == 4:
        return 6
    if ind == 5:
        return 7

    return None


def _buscar_nivel_6024(
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
          AND indicador_referencia = 6024
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

    nivel_calculado = calcular_nivel_maturidade("6024", float(indicador_valor))
    if nivel_calculado is None:
        return None
    return int(nivel_calculado)
