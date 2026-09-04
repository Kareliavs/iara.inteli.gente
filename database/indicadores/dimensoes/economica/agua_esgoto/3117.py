from indicadores.core import IndicatorSpec, Variables, Number, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("IAG0001",))
    valor = to_number(variaveis["IAG0001"])
    return valor, {"IAG0001": valor}


SPEC = IndicatorSpec(
    "3117",
    "economica",
    "agua_esgoto",
    "Indicador = IAG0001",
    ("IAG0001",),
    _calc,
)


