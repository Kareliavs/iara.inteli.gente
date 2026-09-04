from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        raise ValueError("Indicador 3139 invalido (< 0)")
    if ind <= 18:
        return 1
    if ind <= 27:
        return 2
    if ind <= 45:
        return 3
    if ind <= 63:
        return 4
    if ind <= 90:
        return 5
    if ind < 100:
        return 6
    return 7
