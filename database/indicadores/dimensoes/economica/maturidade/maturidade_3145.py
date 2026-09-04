from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number):
    if ind < 0:
        raise ValueError("Indicador 3145 invalido (< 0)")
    if ind <= 10:
        return 1
    if ind <= 47:
        return 2
    if ind <= 67:
        return 3
    if ind <= 83:
        return 4
    if ind <= 90:
        return 5
    if ind < 100:
        return 6
    return 7
