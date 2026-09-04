from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("CAPAG",))
    valor = to_number(variaveis["CAPAG"])
    return valor, {"CAPAG": valor}


SPEC = IndicatorSpec(
    "4013",
    "caracterizacao_sociodemografica",
    "financas_publicas",
    "Indicador = CAPAG",
    ("CAPAG",),
    _calc,
)
