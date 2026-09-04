from __future__ import annotations

from typing import Optional

from indicadores.core.types import Number


def calcular(ind: Number) -> Optional[int]:
    if ind < 0:
        raise ValueError("Indicador 6024 invalido (< 0)")

    if 0 <= ind <= 1:
        return 1
    if ind == 2:
        return 2
    if 3 <= ind <= 4:
        return 3
    if 5 <= ind <= 6:
        return 4
    if 7 <= ind <= 8:
        return 5
    if 9 <= ind <= 10:
        return 6
    if 11 <= ind <= 14:
        return 7

    return None
