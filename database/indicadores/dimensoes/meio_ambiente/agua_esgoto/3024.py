from indicadores.core import IndicatorSpec, Variables, required, to_number



def _calc(variaveis: Variables):
    required(variaveis, ("IES2002",))
    valor = to_number(variaveis["IES2002"])
    return valor, {"IES2002": valor}


SPEC = IndicatorSpec(
    "3024",
    "meio_ambiente",
    "agua_esgoto",
    "Indicador (%) = IES2002",
    ("IES2002",),
    _calc
)
