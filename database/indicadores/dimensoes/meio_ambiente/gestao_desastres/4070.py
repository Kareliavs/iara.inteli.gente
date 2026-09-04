from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("IGR0001",))
    valor = to_number(variaveis["IGR0001"])
    return valor, {"IGR0001": valor}


SPEC = IndicatorSpec(
    "4070",
    "meio_ambiente",
    "gestao_desastres",
    "Indicador (%) = IGR0001",
    ("IGR0001",),
    _calc,
)
