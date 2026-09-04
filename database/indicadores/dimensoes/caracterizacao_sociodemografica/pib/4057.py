from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("PIB_IND",))
    valor = to_number(variaveis["PIB_IND"])
    return valor, {"PIB_IND": valor}


SPEC = IndicatorSpec(
    "4057",
    "caracterizacao_sociodemografica",
    "pib",
    "Indicador = PIB_IND",
    ("PIB_IND",),
    _calc,
)
