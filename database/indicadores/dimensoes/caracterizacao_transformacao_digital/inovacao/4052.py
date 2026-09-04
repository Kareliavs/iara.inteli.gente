from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("INCCRED",))
    valor = to_number(variaveis["INCCRED"])
    return valor, {"INCCRED": valor}


SPEC = IndicatorSpec(
    "4052",
    "caracterizacao_transformacao_digital",
    "inovacao",
    "Indicador = INCCRED",
    ("INCCRED",),
    _calc,
)
