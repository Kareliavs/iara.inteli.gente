from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, required, to_number



def _calc(variaveis: Variables):
    required(variaveis, ("GFI1309",))
    valor = to_number(variaveis["GFI1309"])
    return valor, {"GFI1309": valor}


SPEC = IndicatorSpec(
    "4069",
    "sociocultural",
    "gestao_desastres",
    "GFI1309",
    ("GFI1309",),
    _calc
)
