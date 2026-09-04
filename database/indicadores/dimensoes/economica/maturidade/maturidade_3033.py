from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        raise ValueError("Indicador dados abertos da gestao municipal invalido (< 0)")
    if ind <= 1:
        return 1
    if ind == 2:
        return 2
    if ind <= 4:
        return 3
    if ind <= 6:
        return 4
    if ind == 7:
        return 5
    if ind == 8:
        return 6
    return 7
