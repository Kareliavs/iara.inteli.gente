from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, required, to_number



def _calc(variaveis: Variables):
    required(variaveis, ("OBTFX1",))
    valor = to_number(variaveis["OBTFX1"])
    return valor, {"OBTFX1": valor}


SPEC = IndicatorSpec(
    "4067",
    "sociocultural",
    "saude",
    "OBTFX1",
    ("OBTFX1",),
    _calc
)
