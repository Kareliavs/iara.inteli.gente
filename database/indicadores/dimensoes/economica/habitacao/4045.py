from indicadores.core import IndicatorSpec, Variables, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("FAVCOMUNURB",))
    valor = to_number(variaveis["FAVCOMUNURB"])
    return valor, {"FAVCOMUNURB": valor}


SPEC = IndicatorSpec(
    "4045",
    "economica",
    "habitacao",
    "FAVCOMUNURB",
    ("FAVCOMUNURB",),
    _calc,
)
