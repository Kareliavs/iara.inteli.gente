from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, weighted_sum



def _calc(variaveis: Variables):
    return weighted_sum(
        variaveis,
        (
            ("MGRD01", 1),
            ("MGRD06", 1),
            ("MGDR07", 1),
            ("MGDR08", 1),
            ("MGDR11", 1),
            ("MGRD14", 1),
        ),
        missing_as_zero=True,
    )


SPEC = IndicatorSpec(
    "4042",
    "sociocultural",
    "gestao_desastres",
    "Somatoria(MGRD01*1 + MGRD06*1 + MGDR07*1 + MGDR08*1 + MGDR11*1 + MGRD14*1)",
    ("MGRD01", "MGRD06", "MGDR07", "MGDR08", "MGDR11", "MGRD14"),
    _calc
)
