from indicadores.core import IndicatorSpec, Variables, ensure_pop, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("ILUM", "POP_TOT"))
    ilum = to_number(variaveis["ILUM"])
    pop = to_number(variaveis["POP_TOT"])
    ensure_pop(pop)
    return (ilum / pop) * 100, {"ILUM": ilum, "POP_TOT": pop}


SPEC = IndicatorSpec(
    "3145",
    "economica",
    "urbanizacao_vias_publicas",
    "(ILUM/POP_TOT)*100",
    ("ILUM", "POP_TOT"),
    _calc,
)
