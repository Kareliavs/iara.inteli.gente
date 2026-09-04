from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, required, to_number



def _calc(variaveis: Variables):
    required(variaveis, ("DISTIDSER",))
    valor = to_number(variaveis["DISTIDSER"])
    return valor, {"DISTIDSER": valor}


SPEC = IndicatorSpec(
    "4034",
    "sociocultural",
    "educacao",
    "DISTIDSER",
    ("DISTIDSER",),
    _calc
)
