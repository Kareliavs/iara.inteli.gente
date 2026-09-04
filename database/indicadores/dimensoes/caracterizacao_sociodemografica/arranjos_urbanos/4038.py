from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("VAR10",))
    valor = to_number(variaveis["VAR10"])
    return valor, {"VAR10": valor}


SPEC = IndicatorSpec(
    "4038",
    "caracterizacao_sociodemografica",
    "arranjos_urbanos",
    "Indicador = VAR10",
    ("VAR10",),
    _calc,
)
