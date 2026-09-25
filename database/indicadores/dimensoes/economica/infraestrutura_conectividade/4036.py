from indicadores.core import IndicatorSpec, Variables, Number, ensure_pop, required, to_number


def _calc(variaveis: Variables):
    required(variaveis, ("QNTD_EST_SMP", "POP_TOT"))
    qtd = to_number(variaveis["QNTD_EST_SMP"])
    pop = to_number(variaveis["POP_TOT"])
    ensure_pop(pop)
    return (qtd / pop) * 100, {"QNTD_EST_SMP": qtd, "POP_TOT": pop}


SPEC = IndicatorSpec(
    "4036",
    "economica",
    "infraestrutura_conectividade",
    "(QNTD_EST_SMP/POP_TOT)*100",
    ("QNTD_EST_SMP", "POP_TOT"),
    _calc,
)


