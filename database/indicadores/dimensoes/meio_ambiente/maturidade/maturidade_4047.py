from __future__ import annotations

from typing import Optional

from indicadores.core.types import Number


def calcular(ind: Number) -> Optional[int]:
    if ind < 0:
        raise ValueError("Indicador IES0016 invalido (< 0)")

    if ind <= 0.09:
        return 1

    if ind <= 23:
        return 2

    if ind <= 46.29:
        return 3

    if ind <= 69.99:
        return 4

    if ind <= 85:
        return 5

    if ind <= 99:
        return 6

    if ind <= 100:
        return 7

    return None
