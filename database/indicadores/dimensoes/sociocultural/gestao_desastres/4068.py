from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, weighted_sum



def _calc(variaveis: Variables):
    return weighted_sum(
        variaveis,
        (
            ("MMAM261", 1),
            ("MMAM2610", 1),
            ("MMAM2611", 1),
            ("MMAM2612", 1),
            ("MMAM2613", 1),
            ("MMAM262", 1),
            ("MMAM263", 1),
            ("MMAM264", 1),
            ("MMAM265", 1),
            ("MMAM266", 1),
            ("MMAM267", 1),
            ("MMAM268", 1),
            ("MMAM269", 1),
        ),
        missing_as_zero=True,
    )


SPEC = IndicatorSpec(
    "4068",
    "sociocultural",
    "gestao_desastres",
    "Somatoria(MMAM261*1 + MMAM2610*1 + MMAM2611*1 + MMAM2612*1 + MMAM2613*1 + MMAM262*1 + MMAM263*1 + MMAM264*1 + MMAM265*1 + MMAM266*1 + MMAM267*1 + MMAM268*1 + MMAM269*1)",
    ("MMAM261", "MMAM2610", "MMAM2611", "MMAM2612", "MMAM2613", "MMAM262", "MMAM263", "MMAM264", "MMAM265", "MMAM266", "MMAM267", "MMAM268", "MMAM269"),
    _calc
)
