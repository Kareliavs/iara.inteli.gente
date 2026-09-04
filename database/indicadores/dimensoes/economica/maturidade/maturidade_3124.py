from __future__ import annotations

from typing import Dict, Optional

from indicadores.core.types import Number


INDICADORES_CONTEXTO_PESOS: Dict[int, int] = {
    3049: 1,
    3076: 1,
    4011: 1,
    4012: 1,
    4031: 3,
    4046: 2,
}


def calcular(
    ind: Number,
    conn=None,
    municipio_cod_ibge: Optional[int] = None,
    ano: Optional[int] = None,
) -> Optional[int]:
    if ind < 0:
        raise ValueError("Indicador 3124 invalido (< 0)")

    if ind <= 3:
        return 1
    if ind <= 6:
        return 2
    if ind <= 9:
        return 3
    if ind <= 13:
        return 4
    if ind <= 16:
        return 5

    nivel_base = 6

    if abs(float(ind) - 17.0) >= 1e-9:
        return nivel_base

    nivel_contexto = _calcular_nivel_contexto(conn, municipio_cod_ibge, ano)
    if nivel_contexto is None:
        return nivel_base
    if nivel_contexto < 6:
        return 6
    if nivel_contexto > 7:
        return 7
    return nivel_contexto


def _calcular_nivel_contexto(
    conn,
    municipio_cod_ibge: Optional[int],
    ano: Optional[int],
) -> Optional[int]:
    if conn is None or municipio_cod_ibge is None or ano is None:
        return None

    refs = sorted(INDICADORES_CONTEXTO_PESOS.keys())
    query = """
        SELECT
            indicador_referencia,
            indicador_valor,
            indicador_nivel
        FROM stg.municipio_apresenta_indicador
        WHERE municipio_cod_ibge = %s
          AND ano = %s
          AND indicador_referencia = ANY(%s)
    """

    cur = conn.cursor()
    try:
        cur.execute(query, (municipio_cod_ibge, ano, refs))
        rows = cur.fetchall()
    finally:
        cur.close()

    niveis_por_indicador: Dict[int, int] = {}
    for indicador_ref, indicador_valor, indicador_nivel in rows:
        indicador_ref_int = int(indicador_ref)

        if indicador_nivel is not None:
            niveis_por_indicador[indicador_ref_int] = int(indicador_nivel)
            continue

        if indicador_valor is None:
            continue

        from indicadores import calcular_nivel_maturidade

        nivel_calculado = calcular_nivel_maturidade(str(indicador_ref_int), float(indicador_valor))
        if nivel_calculado is not None:
            niveis_por_indicador[indicador_ref_int] = int(nivel_calculado)

    if not niveis_por_indicador:
        return None

    soma_ponderada = 0.0
    soma_pesos = 0
    for indicador_ref, peso in INDICADORES_CONTEXTO_PESOS.items():
        if indicador_ref not in niveis_por_indicador:
            continue
        soma_ponderada += niveis_por_indicador[indicador_ref] * peso
        soma_pesos += peso

    if soma_pesos == 0:
        return None

    media = soma_ponderada / soma_pesos
    return _arredondar_nivel(media)


def _arredondar_nivel(valor: float) -> int:
    return int(valor + 0.5)
