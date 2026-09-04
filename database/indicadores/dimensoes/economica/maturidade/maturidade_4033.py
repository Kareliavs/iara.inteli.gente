from __future__ import annotations

from typing import List, Optional

from indicadores.core.types import Number


INDICADORES_CONTEXTO_PESOS = {
    4024: 3,
    4025: 3,
    4032: 3,
}


def calcular(
    ind: Number,
    conn=None,
    municipio_cod_ibge: Optional[int] = None,
    ano: Optional[int] = None,
) -> int:
    if ind < 0:
        raise ValueError("Indicador de inovacao invalido (< 0)")
    if ind == 0:
        return 1
    if ind <= 3:
        return 2
    if ind == 4:
        return 3
    nivel_base = 4

    if abs(float(ind) - 5.0) >= 1e-9:
        return nivel_base

    if conn is None or municipio_cod_ibge is None or ano is None:
        return nivel_base

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

    niveis: List[int] = []
    niveis_por_indicador = {}
    for indicador_ref, indicador_valor, indicador_nivel in rows:
        indicador_ref_int = int(indicador_ref)
        if indicador_nivel is not None:
            nivel_int = int(indicador_nivel)
            niveis.append(nivel_int)
            niveis_por_indicador[indicador_ref_int] = nivel_int
            continue
        if indicador_valor is None:
            continue

        # Import local para evitar ciclo de import no carregamento dos modulos de maturidade.
        from indicadores import calcular_nivel_maturidade

        nivel_calculado = calcular_nivel_maturidade(str(indicador_ref_int), float(indicador_valor))
        if nivel_calculado is not None:
            nivel_int = int(nivel_calculado)
            niveis.append(nivel_int)
            niveis_por_indicador[indicador_ref_int] = nivel_int

    if not niveis:
        return nivel_base

    soma_ponderada = 0.0
    soma_pesos = 0
    for indicador_ref, peso in INDICADORES_CONTEXTO_PESOS.items():
        if indicador_ref not in niveis_por_indicador:
            continue
        soma_ponderada += niveis_por_indicador[indicador_ref] * peso
        soma_pesos += peso

    if soma_pesos == 0:
        return nivel_base

    media = soma_ponderada / soma_pesos
    nivel_topico = _arredondar_nivel(media)

    if nivel_topico < 4:
        return 4
    if nivel_topico > 7:
        return 7
    return nivel_topico


def _arredondar_nivel(valor: float) -> int:
    return int(valor + 0.5)
