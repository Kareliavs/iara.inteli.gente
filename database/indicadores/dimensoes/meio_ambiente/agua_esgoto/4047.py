from indicadores.core import IndicatorSpec, Variables, required, to_number



def _calc(variaveis: Variables):
    required(variaveis, ("IES0016",))
    valor = to_number(variaveis["IES0016"])
    return valor, {"IES0016": valor}


SPEC = IndicatorSpec(
    "4047",
    "meio_ambiente",
    "agua_esgoto",
    "Indicador (%) = IES0016",
    ("IES0016",),
    _calc
)
