from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        return 0
    if ind <= 20:
        return 1
    if ind <= 50:
        return 2
    if ind <= 62:
        return 3
    if ind <= 75:
        return 4
    if ind <= 85:
        return 5
    if ind <= 99:
        return 6
    return 7
