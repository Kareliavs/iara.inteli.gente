from indicadores.core import IndicatorSpec, Variables, Number, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("COB5G",))
    valor = to_number(variaveis["COB5G"])
    return valor, {"COB5G": valor}


SPEC = IndicatorSpec(
    "4065",
    "economica",
    "infraestrutura_conectividade",
    "COB5G (binario: 3=sim, 0=nao)",
    ("COB5G",),
    _calc,
)


