from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("PIB_AP",))
    valor = to_number(variaveis["PIB_AP"])
    return valor, {"PIB_AP": valor}


SPEC = IndicatorSpec(
    "4059",
    "caracterizacao_sociodemografica",
    "pib",
    "Indicador = PIB_AP",
    ("PIB_AP",),
    _calc,
)
