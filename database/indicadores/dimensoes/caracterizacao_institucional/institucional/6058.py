from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("PO048",))
    valor = to_number(variaveis["PO048"])
    return valor, {"PO048": valor}


SPEC = IndicatorSpec(
    "6058",
    "caracterizacao_institucional",
    "institucional",
    "Indicador = PO048",
    ("PO048",),
    _calc,
)
