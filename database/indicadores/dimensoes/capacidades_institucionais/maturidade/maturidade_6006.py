from __future__ import annotations

from typing import Optional

from indicadores.core.types import Number


def calcular(ind: Number) -> Optional[int]:
    if ind < 0:
        raise ValueError("Indicador 6006 invalido (< 0)")

    if 0 <= ind <= 1:
        return 1
    if 2 <= ind <= 3:
        return 2
    if 4 <= ind <= 6:
        return 3
    if 7 <= ind <= 8:
        return 4
    if 9 <= ind <= 10:
        return 5
    if 11 <= ind <= 12:
        return 6
    if ind == 13:
        return 7

    return None
