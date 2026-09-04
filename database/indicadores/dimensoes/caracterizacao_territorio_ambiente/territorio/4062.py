from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("TBIOM",))
    valor = to_number(variaveis["TBIOM"])
    return valor, {"TBIOM": valor}


SPEC = IndicatorSpec(
    "4062",
    "caracterizacao_territorio_ambiente",
    "territorio",
    "Indicador = TBIOM",
    ("TBIOM",),
    _calc,
)
