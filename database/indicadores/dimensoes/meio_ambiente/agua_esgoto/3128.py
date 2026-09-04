from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("IGR0005",))
    valor = to_number(variaveis["IGR0005"])
    return valor, {"IGR0005": valor}


SPEC = IndicatorSpec(
    "3128",
    "meio_ambiente",
    "agua_esgoto",
    "Indicador (%) = IGR0005",
    ("IGR0005",),
    _calc,
)
