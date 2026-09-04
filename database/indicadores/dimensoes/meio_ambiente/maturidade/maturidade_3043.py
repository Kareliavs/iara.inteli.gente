from __future__ import annotations

from typing import Optional

from indicadores.core.types import Number


def calcular(ind: Number) -> Optional[int]:
    if ind < 0:
        raise ValueError("Indicador 3043 invalido (< 0)")

    if ind == 0:
        return 1

    if ind == 1:
        return 2

    if ind == 2:
        return 3

    if ind <= 4:
        return 4

    if ind <= 7:
        return 5

    if ind == 8:
        return 6

    if ind == 9:
        return 7

    return None
