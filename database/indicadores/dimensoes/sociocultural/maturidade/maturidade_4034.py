from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        raise ValueError("Indicador de educacao invalido (< 0)")
    if ind >= 51:
        return 1
    if ind >= 31:
        return 2
    if ind >= 21:
        return 3
    if ind >= 16:
        return 4
    if ind >= 11:
        return 5
    if ind >= 6:
        return 6
    return 7
