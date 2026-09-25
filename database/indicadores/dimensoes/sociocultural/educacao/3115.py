from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, ensure_pop, required, to_number



def _calc(variaveis: Variables):
    required(variaveis, ("QT_VAGA_TOTAL", "POP_TOT"))
    vagas = to_number(variaveis["QT_VAGA_TOTAL"])
    pop = to_number(variaveis["POP_TOT"])
    ensure_pop(pop)
    return (vagas / pop) * 100, {"QT_VAGA_TOTAL": vagas, "POP_TOT": pop}


SPEC = IndicatorSpec(
    "3115",
    "sociocultural",
    "educacao",
    "(QT_VAGA_TOTAL/POP_TOT)*100",
    ("QT_VAGA_TOTAL", "POP_TOT"),
    _calc
)
