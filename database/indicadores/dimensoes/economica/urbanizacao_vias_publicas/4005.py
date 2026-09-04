from indicadores.core import IndicatorSpec, Number, Variables, ensure_pop, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("PAVIM", "POP_TOT"))
    pavim = to_number(variaveis["PAVIM"])
    pop = to_number(variaveis["POP_TOT"])
    ensure_pop(pop)
    return (pavim / pop) * 100, {"PAVIM": pavim, "POP_TOT": pop}


SPEC = IndicatorSpec(
    "4005",
    "economica",
    "urbanizacao_vias_publicas",
    "(PAVIM/POP_TOT)*100",
    ("PAVIM", "POP_TOT"),
    _calc,
)


