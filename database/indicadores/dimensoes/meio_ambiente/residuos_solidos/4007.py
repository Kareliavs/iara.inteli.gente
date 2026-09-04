from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("IRS0005",))
    valor = to_number(variaveis["IRS0005"])
    return valor, {"IRS0005": valor}


SPEC = IndicatorSpec(
    "4007",
    "meio_ambiente",
    "residuos_solidos",
    "Indicador (%) = IRS0005",
    ("IRS0005",),
    _calc,
)
