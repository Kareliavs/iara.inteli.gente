from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("IAG2013",))
    valor = to_number(variaveis["IAG2013"])
    return valor, {"IAG2013": valor}


SPEC = IndicatorSpec(
    "3110",
    "meio_ambiente",
    "agua_esgoto",
    "Indicador (%) = IAG2013",
    ("IAG2013",),
    _calc,
)
