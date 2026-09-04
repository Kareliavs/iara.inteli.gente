from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        raise ValueError("Indicador de saude invalido (< 0)")
    if ind <= 75:
        return 1
    if ind <= 199:
        return 2
    if ind <= 400:
        return 3
    if ind <= 850:
        return 4
    if ind <= 900:
        return 5
    if ind < 2000:
        return 6
    return 7
