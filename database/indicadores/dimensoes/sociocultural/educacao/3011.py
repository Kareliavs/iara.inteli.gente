from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, ensure_pop, required, to_number



def _calc(variaveis: Variables):
    required(variaveis, ("POP_ANALF", "POP_TOT_MFE"))
    pop_analf = to_number(variaveis["POP_ANALF"])
    pop_tot_mfe = to_number(variaveis["POP_TOT_MFE"])
    ensure_pop(pop_tot_mfe)
    return (pop_analf / pop_tot_mfe) * 100, {"POP_ANALF": pop_analf, "POP_TOT_MFE": pop_tot_mfe}


SPEC = IndicatorSpec(
    "3011",
    "sociocultural",
    "educacao",
    "(POP_ANALF/POP_TOT_MFE)*100",
    ("POP_ANALF", "POP_TOT_MFE"),
    _calc
)
