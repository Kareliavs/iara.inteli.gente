from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("IRS0001",))
    valor = to_number(variaveis["IRS0001"])
    return valor, {"IRS0001": valor}


SPEC = IndicatorSpec(
    "3122",
    "economica",
    "residuos_solidos",
    "Indicador = IRS0001",
    ("IRS0001",),
    _calc,
)
