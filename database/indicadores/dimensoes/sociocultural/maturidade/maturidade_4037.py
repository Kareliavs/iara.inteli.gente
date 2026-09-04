from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        raise ValueError("Indicador de educacao invalido (< 0)")
    if ind <= 32.99:
        return 1
    if ind <= 59.99:
        return 2
    if ind <= 70:
        return 3
    if ind <= 80:
        return 4
    if ind <= 90:
        return 5
    if ind <= 99:
        return 6
    return 7
