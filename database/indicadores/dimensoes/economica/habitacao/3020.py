from indicadores.core import IndicatorSpec, Variables, ensure_pop, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("POP_FAV", "POP_TOT"))
    fav = to_number(variaveis["POP_FAV"])
    pop = to_number(variaveis["POP_TOT"])
    ensure_pop(pop)
    return fav / pop, {"POP_FAV": fav, "POP_TOT": pop}


SPEC = IndicatorSpec(
    "3020",
    "economica",
    "habitacao",
    "POP_FAV/POP_TOT",
    ("POP_FAV", "POP_TOT"),
    _calc,
)
