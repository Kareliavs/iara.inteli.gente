from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("PIB_AG",))
    valor = to_number(variaveis["PIB_AG"])
    return valor, {"PIB_AG": valor}


SPEC = IndicatorSpec(
    "4056",
    "caracterizacao_sociodemografica",
    "pib",
    "Indicador = PIB_AG",
    ("PIB_AG",),
    _calc,
)
