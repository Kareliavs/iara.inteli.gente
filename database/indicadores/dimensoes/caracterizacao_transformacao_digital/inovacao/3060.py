from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("EMP_TICM",))
    valor = to_number(variaveis["EMP_TICM"])
    return valor, {"EMP_TICM": valor}


SPEC = IndicatorSpec(
    "3060",
    "caracterizacao_transformacao_digital",
    "inovacao",
    "Indicador = EMP_TICM",
    ("EMP_TICM",),
    _calc,
)
