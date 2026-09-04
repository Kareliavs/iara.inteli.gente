from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        return 0
    if ind <= 45.40:
        return 1
    if ind <= 78.28:
        return 2
    if ind <= 81.71:
        return 3
    if ind <= 87.72:
        return 4
    if ind <= 93.73:
        return 5
    if ind <= 99.00:
        return 6
    return 7
