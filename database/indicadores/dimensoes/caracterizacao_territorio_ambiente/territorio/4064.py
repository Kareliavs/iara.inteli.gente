from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("MINER",))
    valor = to_number(variaveis["MINER"])
    return valor, {"MINER": valor}


SPEC = IndicatorSpec(
    "4064",
    "caracterizacao_territorio_ambiente",
    "territorio",
    "Indicador = MINER",
    ("MINER",),
    _calc,
)
