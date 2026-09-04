from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("UCONS",))
    valor = to_number(variaveis["UCONS"])
    return valor, {"UCONS": valor}


SPEC = IndicatorSpec(
    "4061",
    "caracterizacao_territorio_ambiente",
    "territorio",
    "Indicador = UCONS",
    ("UCONS",),
    _calc,
)
