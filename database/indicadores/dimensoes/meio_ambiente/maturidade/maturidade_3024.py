from __future__ import annotations

from typing import Optional

from indicadores.core.types import Number


def calcular(ind: Number) -> Optional[int]:
    if ind < 0:
        raise ValueError("Indicador IES2002 invalido (< 0)")

    if ind <= 36.51:
        return 1

    if ind <= 53.10:
        return 2

    if ind <= 63.76:
        return 3

    if ind <= 78.43:
        return 4

    if ind <= 87.02:
        return 5

    if ind <= 99:
        return 6

    if ind <= 100:
        return 7

    return 7
