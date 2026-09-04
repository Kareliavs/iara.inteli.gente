from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("PIB_SRV",))
    valor = to_number(variaveis["PIB_SRV"])
    return valor, {"PIB_SRV": valor}


SPEC = IndicatorSpec(
    "4058",
    "caracterizacao_sociodemografica",
    "pib",
    "Indicador = PIB_SRV",
    ("PIB_SRV",),
    _calc,
)
