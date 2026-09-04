from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        raise ValueError("Indicador de saude invalido (< 0)")
    if ind >= 0.4:
        return 1
    if ind >= 0.18:
        return 2
    if ind >= 0.13:
        return 3
    if ind >= 0.095:
        return 4
    if ind >= 0.055:
        return 5
    if ind >= 0.015:
        return 6
    return 7
