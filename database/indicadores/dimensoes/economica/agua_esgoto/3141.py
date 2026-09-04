from indicadores.core import IndicatorSpec, Variables, Number, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("IES0002",))
    valor = to_number(variaveis["IES0002"])
    return valor, {"IES0002": valor}


SPEC = IndicatorSpec(
    "3141",
    "economica",
    "agua_esgoto",
    "Indicador = IES0002",
    ("IES0002",),
    _calc,
)


