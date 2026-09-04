from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        return 0
    if ind <= 35.0:
        return 1
    if ind <= 45.0:
        return 2
    if ind <= 62.0:
        return 3
    if ind <= 75.0:
        return 4
    if ind <= 87.0:
        return 5
    if ind <= 94.79:
        return 6
    return 7
