from __future__ import annotations

from typing import Optional

from indicadores.core.types import Number


def calcular(ind: Number) -> Optional[int]:
    if ind < 0:
        raise ValueError("Indicador 6044 invalido (< 0)")

    if 0 <= ind <= 1:
        return 1
    if 2 <= ind <= 3:
        return 2
    if 4 <= ind <= 5:
        return 3
    if 6 <= ind <= 7:
        return 4
    if 8 <= ind <= 9:
        return 5
    if 10 <= ind <= 11:
        return 6
    if ind == 12:
        return 7

    return None
