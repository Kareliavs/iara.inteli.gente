from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("POP_TOT",))
    valor = to_number(variaveis["POP_TOT"])
    return valor, {"POP_TOT": valor}


SPEC = IndicatorSpec(
    "4003",
    "caracterizacao_sociodemografica",
    "porte",
    "Indicador = POP_TOT",
    ("POP_TOT",),
    _calc,
)
