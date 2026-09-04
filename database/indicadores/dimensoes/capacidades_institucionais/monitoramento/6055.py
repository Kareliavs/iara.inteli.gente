from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("MTIC12B13",))
    valor = to_number(variaveis["MTIC12B13"])
    return valor, {"MTIC12B13": valor}


SPEC = IndicatorSpec(
    "6055",
    "capacidades_institucionais",
    "monitoramento",
    "Indicador = MTIC12B13",
    ("MTIC12B13",),
    _calc,
)
