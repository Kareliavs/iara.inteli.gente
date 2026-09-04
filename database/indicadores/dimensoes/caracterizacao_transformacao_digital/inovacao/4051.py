from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("EMPPqTec",))
    valor = to_number(variaveis["EMPPqTec"])
    return valor, {"EMPPqTec": valor}


SPEC = IndicatorSpec(
    "4051",
    "caracterizacao_transformacao_digital",
    "inovacao",
    "Indicador = EMPPqTec",
    ("EMPPqTec",),
    _calc,
)
