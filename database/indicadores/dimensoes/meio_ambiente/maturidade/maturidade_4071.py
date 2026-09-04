from __future__ import annotations

from typing import Optional

from indicadores.core.types import Number


def calcular(ind: Number) -> Optional[int]:
    if ind < 0:
        raise ValueError("Indicador GTA1009 invalido (< 0)")

    if ind >= 10000:
        return 1

    if ind >= 3000:
        return 2

    if ind >= 900:
        return 3

    if ind >= 50:
        return 4

    if ind >= 20:
        return 5

    if ind >= 7:
        return 6

    return 7
