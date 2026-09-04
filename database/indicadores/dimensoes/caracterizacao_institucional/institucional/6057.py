from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("APLANDIR",))
    valor = to_number(variaveis["APLANDIR"])
    return valor, {"APLANDIR": valor}


SPEC = IndicatorSpec(
    "6057",
    "caracterizacao_institucional",
    "institucional",
    "Indicador = APLANDIR",
    ("APLANDIR",),
    _calc,
)
