from __future__ import annotations

from indicadores.core.types import Number


def calcular(ind: Number) -> int:
    if ind < 0:
        raise ValueError("Indicador de seguranca publica invalido (< 0)")
    if ind >= 92:
        return 1
    if ind >= 31.60:
        return 2
    if ind >= 22.38:
        return 3
    if ind >= 14.10:
        return 4
    if ind >= 7.10:
        return 5
    if ind >= 1.99:
        return 6
    return 7
