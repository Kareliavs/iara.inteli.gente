from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, required, to_number



def _calc(variaveis: Variables):
    required(variaveis, ("IDEB",))
    valor = to_number(variaveis["IDEB"])
    return valor, {"IDEB": valor}


SPEC = IndicatorSpec(
    "3086",
    "sociocultural",
    "educacao",
    "IDEB",
    ("IDEB",),
    _calc
)
