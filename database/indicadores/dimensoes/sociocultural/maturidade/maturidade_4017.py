from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        raise ValueError("Indicador de seguranca publica invalido (< 0)")
    if ind == 0:
        return 1
    if ind == 1:
        return 2
    if ind <= 3:
        return 3
    if ind <= 5:
        return 4
    if ind <= 7:
        return 5
    if ind == 8:
        return 6
    return 7
