from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        raise ValueError("Indicador de saude invalido (< 0)")
    if ind == 0:
        return 1
    if ind <= 169:
        return 2
    if ind <= 248:
        return 3
    if ind <= 496:
        return 4
    if ind <= 887:
        return 5
    if ind <= 1199:
        return 6
    return 7
