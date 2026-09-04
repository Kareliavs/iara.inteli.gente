from __future__ import annotations

from typing import Optional

from indicadores.core.types import Number


def calcular(ind: Number) -> Optional[int]:
    if ind < 0:
        raise ValueError("Indicador IAG2006 invalido (< 0)")

    if 0 <= ind <= 50 or ind >= 250:
        return 1

    if (50 < ind <= 70) or (155 <= ind < 250):
        return 2

    if (70 < ind <= 90) or (150 <= ind < 155):
        return 3

    if (90 < ind <= 93) or (130 <= ind < 150):
        return 4

    if (93 < ind <= 96) or (120 <= ind < 130):
        return 5

    if (96 < ind <= 99) or (111 <= ind < 120):
        return 6

    if 99 < ind < 111:
        return 7

    return None
