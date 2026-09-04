from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("DCINST",))
    valor = to_number(variaveis["DCINST"])
    return valor, {"DCINST": valor}


SPEC = IndicatorSpec(
    "4161",
    "caracterizacao_transformacao_digital",
    "inovacao",
    "Indicador = DCINST",
    ("DCINST",),
    _calc,
)
