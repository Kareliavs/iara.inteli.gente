from indicadores.core import IndicatorSpec, Variables, Number, ensure_pop, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("TOT_ACESSOS_3G", "TOT_ACESSOS_4G_WCMDA", "POP_TOT"))
    a3 = to_number(variaveis["TOT_ACESSOS_3G"])
    a4 = to_number(variaveis["TOT_ACESSOS_4G_WCMDA"])
    pop = to_number(variaveis["POP_TOT"])
    ensure_pop(pop)
    return ((a3 + a4) / pop) * 100, {"TOT_ACESSOS_3G": a3, "TOT_ACESSOS_4G_WCMDA": a4, "POP_TOT": pop}


SPEC = IndicatorSpec(
    "3022",
    "economica",
    "infraestrutura_conectividade",
    "((TOT_ACESSOS_3G + TOT_ACESSOS_4G_WCMDA)/POP_TOT)*100",
    ("TOT_ACESSOS_3G", "TOT_ACESSOS_4G_WCMDA", "POP_TOT"),
    _calc,
)


