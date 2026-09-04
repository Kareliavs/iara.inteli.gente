from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("IEPCRED",))
    valor = to_number(variaveis["IEPCRED"])
    return valor, {"IEPCRED": valor}


SPEC = IndicatorSpec(
    "4053",
    "caracterizacao_transformacao_digital",
    "inovacao",
    "Indicador = IEPCRED",
    ("IEPCRED",),
    _calc,
)
