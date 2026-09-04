from indicadores.core import IndicatorSpec, Variables, ensure_pop, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("PIB", "POP_TOT"))
    pib = to_number(variaveis["PIB"])
    pop = to_number(variaveis["POP_TOT"])
    ensure_pop(pop)
    return pib / pop, {"PIB": pib, "POP_TOT": pop}


SPEC = IndicatorSpec(
    "3087",
    "caracterizacao_sociodemografica",
    "pib",
    "PIB/POP_TOT",
    ("PIB", "POP_TOT"),
    _calc,
)
