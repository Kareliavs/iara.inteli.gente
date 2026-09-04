from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("IDHM",))
    valor = to_number(variaveis["IDHM"])
    return valor, {"IDHM": valor}


SPEC = IndicatorSpec(
    "4001",
    "caracterizacao_sociodemografica",
    "idhm",
    "Indicador = IDHM",
    ("IDHM",),
    _calc,
)
