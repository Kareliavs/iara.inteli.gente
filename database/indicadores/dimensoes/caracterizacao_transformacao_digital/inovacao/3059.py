from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("EMPG_TIC",))
    valor = to_number(variaveis["EMPG_TIC"])
    return valor, {"EMPG_TIC": valor}


SPEC = IndicatorSpec(
    "3059",
    "caracterizacao_transformacao_digital",
    "inovacao",
    "Indicador = EMPG_TIC",
    ("EMPG_TIC",),
    _calc,
)
