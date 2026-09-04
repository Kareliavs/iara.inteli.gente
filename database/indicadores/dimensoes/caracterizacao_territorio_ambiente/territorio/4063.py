from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("UEEOL",))
    valor = to_number(variaveis["UEEOL"])
    return valor, {"UEEOL": valor}


SPEC = IndicatorSpec(
    "4063",
    "caracterizacao_territorio_ambiente",
    "territorio",
    "Indicador = UEEOL",
    ("UEEOL",),
    _calc,
)
