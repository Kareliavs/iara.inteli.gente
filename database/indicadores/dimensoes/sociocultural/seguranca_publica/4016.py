from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, required, to_number



def _calc(variaveis: Variables):
    required(variaveis, ("THOM",))
    valor = to_number(variaveis["THOM"])
    return valor, {"THOM": valor}


SPEC = IndicatorSpec(
    "4016",
    "sociocultural",
    "seguranca_publica",
    "THOM",
    ("THOM",),
    _calc
)
