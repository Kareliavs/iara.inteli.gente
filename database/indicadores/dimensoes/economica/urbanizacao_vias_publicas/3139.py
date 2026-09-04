from indicadores.core import IndicatorSpec, Variables, ensure_pop, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("ARV", "POP_TOT"))
    arv = to_number(variaveis["ARV"])
    pop = to_number(variaveis["POP_TOT"])
    ensure_pop(pop)
    return (arv / pop) * 100, {"ARV": arv, "POP_TOT": pop}


SPEC = IndicatorSpec(
    "3139",
    "economica",
    "urbanizacao_vias_publicas",
    "(ARV/POP_TOT)*100",
    ("ARV", "POP_TOT"),
    _calc,
)
