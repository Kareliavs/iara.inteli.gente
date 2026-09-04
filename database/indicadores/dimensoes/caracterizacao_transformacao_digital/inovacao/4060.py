from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("EMPRLB",))
    valor = to_number(variaveis["EMPRLB"])
    return valor, {"EMPRLB": valor}


SPEC = IndicatorSpec(
    "4060",
    "caracterizacao_transformacao_digital",
    "inovacao",
    "Indicador = EMPRLB",
    ("EMPRLB",),
    _calc,
)
