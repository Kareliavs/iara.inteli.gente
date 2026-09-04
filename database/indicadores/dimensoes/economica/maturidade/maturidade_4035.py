from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        return 0
    if ind <= 2.03:
        return 1
    if ind <= 4.61:
        return 2
    if ind <= 15.78:
        return 3
    if ind <= 23.56:
        return 4
    if ind <= 31.34:
        return 5
    if ind <= 50.0:
        return 6
    return 7
