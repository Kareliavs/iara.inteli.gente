from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("PO028",))
    valor = to_number(variaveis["PO028"])
    return valor, {"PO028": valor}


SPEC = IndicatorSpec(
    "6059",
    "caracterizacao_institucional",
    "institucional",
    "Indicador = PO028",
    ("PO028",),
    _calc,
)
