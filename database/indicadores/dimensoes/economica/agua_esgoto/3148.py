from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("GTA3003",))
    valor = to_number(variaveis["GTA3003"])
    return valor, {"GTA3003": valor}


SPEC = IndicatorSpec(
    "3148",
    "economica",
    "agua_esgoto",
    "Indicador = GTA3003",
    ("GTA3003",),
    _calc,
)
