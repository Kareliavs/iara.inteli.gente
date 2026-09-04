from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        raise ValueError("Indicador de saude invalido (< 0)")
    if ind >= 650:
        return 1
    if ind >= 150:
        return 2
    if ind >= 30:
        return 3
    if ind >= 15:
        return 4
    if ind >= 6:
        return 5
    if ind >= 3:
        return 6
    return 7
