from indicadores.core import IndicatorSpec, Variables, ensure_pop, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("POP_OCVE", "POP_TOT"))
    pop_ocve = to_number(variaveis["POP_OCVE"])
    pop_tot = to_number(variaveis["POP_TOT"])
    ensure_pop(pop_tot)
    return (pop_ocve / pop_tot) * 100.0, {"POP_OCVE": pop_ocve, "POP_TOT": pop_tot}


SPEC = IndicatorSpec(
    "3135",
    "caracterizacao_sociodemografica",
    "emprego",
    "(POP_OCVE/POP_TOT)*100",
    ("POP_OCVE", "POP_TOT"),
    _calc,
)
