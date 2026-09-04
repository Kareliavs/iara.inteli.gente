from __future__ import annotations

from typing import Optional

from indicadores.core.types import Number


def calcular(ind: Number) -> Optional[int]:
    if ind < 0:
        raise ValueError("Indicador 6035 invalido (< 0)")

    if ind == 0:
        return 1
    if ind == 1:
        return 2
    if 2 <= ind <= 3:
        return 3
    if 4 <= ind <= 5:
        return 4
    if ind == 6:
        return 5
    if ind == 7:
        return 6
    if ind == 8:
        return 7

    return None
