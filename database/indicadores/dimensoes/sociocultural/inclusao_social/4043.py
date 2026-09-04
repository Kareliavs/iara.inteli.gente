from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, weighted_sum



def _calc(variaveis: Variables):
    return weighted_sum(
        variaveis,
        (
            ("MPPM01", 3),
            ("MPPM101", 1),
            ("MPPM102", 1),
            ("MPPM103", 2),
            ("MPPM104", 2),
            ("MPPM105", 2),
        ),
        missing_as_zero=True,
    )


SPEC = IndicatorSpec(
    "4043",
    "sociocultural",
    "inclusao_social",
    "Somatoria(MPPM01*3 + MPPM101*1 + MPPM102*1 + MPPM103*2 + MPPM104*2 + MPPM105*2)",
    ("MPPM01", "MPPM101", "MPPM102", "MPPM103", "MPPM104", "MPPM105"),
    _calc
)
