from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("EMPG_TUR",))
    valor = to_number(variaveis["EMPG_TUR"])
    return valor, {"EMPG_TUR": valor}


SPEC = IndicatorSpec(
    "3058",
    "caracterizacao_territorio_ambiente",
    "territorio",
    "Indicador = EMPG_TUR",
    ("EMPG_TUR",),
    _calc,
)
