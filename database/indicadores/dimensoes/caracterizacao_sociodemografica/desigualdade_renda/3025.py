from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("GINI",))
    valor = to_number(variaveis["GINI"])
    return valor, {"GINI": valor}


SPEC = IndicatorSpec(
    "3025",
    "caracterizacao_sociodemografica",
    "desigualdade_renda",
    "Indicador = GINI",
    ("GINI",),
    _calc,
)
