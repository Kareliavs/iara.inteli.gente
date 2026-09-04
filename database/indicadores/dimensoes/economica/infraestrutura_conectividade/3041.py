from indicadores.core import IndicatorSpec, Variables, Number, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("ECFO",))
    valor = to_number(variaveis["ECFO"])
    return valor, {"ECFO": valor}


SPEC = IndicatorSpec(
    "3041",
    "economica",
    "infraestrutura_conectividade",
    "ECFO (binario: 1=sim, 0=nao)",
    ("ECFO",),
    _calc,
)


