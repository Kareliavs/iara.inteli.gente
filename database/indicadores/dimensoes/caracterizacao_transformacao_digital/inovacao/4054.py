from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("CIPCRED",))
    valor = to_number(variaveis["CIPCRED"])
    return valor, {"CIPCRED": valor}


SPEC = IndicatorSpec(
    "4054",
    "caracterizacao_transformacao_digital",
    "inovacao",
    "Indicador = CIPCRED",
    ("CIPCRED",),
    _calc,
)
