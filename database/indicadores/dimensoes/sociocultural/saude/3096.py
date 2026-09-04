from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, ensure_pop, required, to_number



def _calc(variaveis: Variables):
    required(variaveis, ("MEDSUS", "POP_TOT"))
    medsus = to_number(variaveis["MEDSUS"])
    pop = to_number(variaveis["POP_TOT"])
    ensure_pop(pop)
    return (medsus / pop) * 1000, {"MEDSUS": medsus, "POP_TOT": pop}


SPEC = IndicatorSpec(
    "3096",
    "sociocultural",
    "saude",
    "(MEDSUS/POP_TOT)*1000",
    ("MEDSUS", "POP_TOT"),
    _calc
)
