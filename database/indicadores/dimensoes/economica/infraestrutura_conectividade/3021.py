from indicadores.core import IndicatorSpec, Variables, Number, ensure_pop, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("Acesso_SCM", "POP_TOT"))
    acesso = to_number(variaveis["Acesso_SCM"])
    pop = to_number(variaveis["POP_TOT"])
    ensure_pop(pop)
    return (acesso / pop) * 100, {"Acesso_SCM": acesso, "POP_TOT": pop}


SPEC = IndicatorSpec(
    "3021",
    "economica",
    "infraestrutura_conectividade",
    "(Acesso_SCM/POP_TOT)*100",
    ("Acesso_SCM", "POP_TOT"),
    _calc,
)


