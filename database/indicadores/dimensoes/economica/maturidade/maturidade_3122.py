from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        raise ValueError("Indicador 3122 invalido (< 0)")
    if ind <= 35.99:
        return 1
    if ind <= 55.00:
        return 2
    if ind <= 75.00:
        return 3
    if ind <= 85.00:
        return 4
    if ind <= 92.20:
        return 5
    if ind <= 99.00:
        return 6
    return 7
