from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, required, to_number



def _calc(variaveis: Variables):
    required(variaveis, ("MTIC22",))
    valor = to_number(variaveis["MTIC22"])
    return valor, {"MTIC22": valor}


SPEC = IndicatorSpec(
    "3037",
    "sociocultural",
    "inclusao_digital",
    "MTIC22",
    ("MTIC22",),
    _calc
)
