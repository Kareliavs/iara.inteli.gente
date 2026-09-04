from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        raise ValueError("Indicador de saude invalido (< 0)")
    if ind >= 70:
        return 1
    if ind >= 35:
        return 2
    if ind >= 20:
        return 3
    if ind >= 10:
        return 4
    if ind >= 4:
        return 5
    if ind >= 1:
        return 6
    return 7
