from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, ensure_pop, required, to_number



def _calc(variaveis: Variables):
    required(variaveis, ("NUM_LEITOS_PUB", "POP_TOT"))
    num_leitos_pub = to_number(variaveis["NUM_LEITOS_PUB"])
    pop = to_number(variaveis["POP_TOT"])
    ensure_pop(pop)
    return (num_leitos_pub / pop) * 1000, {"NUM_LEITOS_PUB": num_leitos_pub, "POP_TOT": pop}


SPEC = IndicatorSpec(
    "3095",
    "sociocultural",
    "saude",
    "(NUM_LEITOS_PUB/POP_TOT)*1000",
    ("NUM_LEITOS_PUB", "POP_TOT"),
    _calc
)
