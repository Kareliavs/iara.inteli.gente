from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        raise ValueError("Indicador 3020 invalido (< 0)")
    if ind >= 20:
        return 1
    if ind >= 9.40:
        return 2
    if ind >= 6.80:
        return 3
    if ind >= 4.80:
        return 4
    if ind >= 3:
        return 5
    if ind >= 1:
        return 6
    return 7
