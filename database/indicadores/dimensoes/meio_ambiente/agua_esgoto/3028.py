from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("IAG2006",))
    valor = to_number(variaveis["IAG2006"])
    return valor, {"IAG2006": valor}


SPEC = IndicatorSpec(
    "3028",
    "meio_ambiente",
    "agua_esgoto",
    "Indicador = IAG2006",
    ("IAG2006",),
    _calc,
)
