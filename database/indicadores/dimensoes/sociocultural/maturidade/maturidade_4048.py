from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        raise ValueError("Indicador de educacao invalido (< 0)")
    if ind <= 500:
        return 1
    if ind <= 1000:
        return 2
    if ind <= 1500:
        return 3
    if ind <= 2000:
        return 4
    if ind <= 4000:
        return 5
    if ind <= 6000:
        return 6
    return 7
