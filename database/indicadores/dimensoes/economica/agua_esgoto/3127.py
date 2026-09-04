from indicadores.core import IndicatorSpec, Variables, Number, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("IES0001",))
    valor = to_number(variaveis["IES0001"])
    return valor, {"IES0001": valor}


SPEC = IndicatorSpec(
    "3127",
    "economica",
    "agua_esgoto",
    "Indicador = IES0001",
    ("IES0001",),
    _calc,
)


