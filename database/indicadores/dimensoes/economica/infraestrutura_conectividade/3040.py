from indicadores.core import IndicatorSpec, Variables, Number, weighted_sum


def _calc(variaveis: Variables):
    return weighted_sum(variaveis, (("EC3G", 1), ("EC4G", 2)), missing_as_zero=True)


SPEC = IndicatorSpec(
    "3040",
    "economica",
    "infraestrutura_conectividade",
    "Somatoria(EC3G*1 + EC4G*2)",
    ("EC3G", "EC4G"),
    _calc,
)


