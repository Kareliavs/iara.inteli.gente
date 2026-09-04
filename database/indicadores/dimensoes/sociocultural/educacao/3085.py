from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, required, to_number



def _calc(variaveis: Variables):
    required(variaveis, ("QT_MAT_FUND",))
    valor = to_number(variaveis["QT_MAT_FUND"])
    return valor, {"QT_MAT_FUND": valor}


SPEC = IndicatorSpec(
    "3085",
    "sociocultural",
    "educacao",
    "QT_MAT_FUND",
    ("QT_MAT_FUND",),
    _calc
)
