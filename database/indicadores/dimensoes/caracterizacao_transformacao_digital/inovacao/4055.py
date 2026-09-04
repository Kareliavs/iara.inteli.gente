from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("EMPRESHAB",))
    valor = to_number(variaveis["EMPRESHAB"])
    return valor, {"EMPRESHAB": valor}


SPEC = IndicatorSpec(
    "4055",
    "caracterizacao_transformacao_digital",
    "inovacao",
    "Indicador = EMPRESHAB",
    ("EMPRESHAB",),
    _calc,
)
