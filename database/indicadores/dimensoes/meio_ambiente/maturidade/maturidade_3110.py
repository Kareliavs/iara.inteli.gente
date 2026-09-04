from __future__ import annotations

from typing import Optional

from indicadores.core.types import Number


def calcular(ind: Number) -> Optional[int]:
    if ind < 0:
        raise ValueError("Indicador IAG2013 invalido (< 0)")

    if 94.43 <= ind <= 100:
        return 1

    if 43.48 <= ind <= 94.42:
        return 2

    if 38.50 <= ind <= 43.47:
        return 3

    if 32.50 <= ind <= 38.49:
        return 4

    if 20.78 <= ind <= 32.49:
        return 5

    if 0.09 <= ind <= 20.77:
        return 6

    if 0 <= ind <= 0.08:
        return 7

    return None
