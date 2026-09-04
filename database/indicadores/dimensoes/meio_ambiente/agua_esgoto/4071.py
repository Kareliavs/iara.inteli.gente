from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("GTA1009",))
    valor = to_number(variaveis["GTA1009"])
    return valor, {"GTA1009": valor}


SPEC = IndicatorSpec(
    "4071",
    "meio_ambiente",
    "agua_esgoto",
    "Indicador (%) = GTA1009",
    ("GTA1009",),
    _calc,
)
