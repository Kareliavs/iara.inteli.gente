from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        raise ValueError("Indicador de educacao invalido (< 0)")
    if ind <= 6.99:
        return 1
    if ind <= 13.99:
        return 2
    if ind <= 18.99:
        return 3
    if ind <= 30.99:
        return 4
    if ind <= 54.99:
        return 5
    if ind <= 77.99:
        return 6
    return 7
