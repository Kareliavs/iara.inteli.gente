from __future__ import annotations

from typing import Optional

from indicadores.core.types import Number


def calcular(ind: Number) -> Optional[int]:
    if ind < 0:
        raise ValueError("Indicador IRS0005 invalido (< 0)")

    if 0 <= ind <= 1:
        return 1

    if 1 < ind <= 2:
        return 2

    if 2 < ind <= 3:
        return 3

    if 3 < ind <= 8.99:
        return 4

    if 9 <= ind <= 25.99:
        return 5

    if 26 <= ind <= 49.99:
        return 6

    if 50 <= ind <= 100:
        return 7

    return None
