from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        return 0
    if ind <= 31.54:
        return 1
    if ind <= 70.1:
        return 2
    if ind <= 89.6:
        return 3
    if ind <= 92.4:
        return 4
    if ind <= 97.99:
        return 5
    if ind <= 99:
        return 6
    return 7
