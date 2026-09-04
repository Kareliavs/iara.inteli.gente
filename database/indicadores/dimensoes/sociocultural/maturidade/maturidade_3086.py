from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        raise ValueError("Indicador de educacao invalido (< 0)")
    if ind <= 3.49:
        return 1
    if ind <= 4.16:
        return 2
    if ind <= 5.09:
        return 3
    if ind <= 6.29:
        return 4
    if ind <= 7.09:
        return 5
    if ind <= 8.99:
        return 6
    return 7
