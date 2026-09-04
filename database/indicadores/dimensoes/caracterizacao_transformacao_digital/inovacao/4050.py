from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("CFED",))
    valor = to_number(variaveis["CFED"])
    return valor, {"CFED": valor}


SPEC = IndicatorSpec(
    "4050",
    "caracterizacao_transformacao_digital",
    "inovacao",
    "Indicador = CFED",
    ("CFED",),
    _calc,
)
