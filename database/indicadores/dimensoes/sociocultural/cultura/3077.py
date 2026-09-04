from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, weighted_sum



def _calc(variaveis: Variables):
    return weighted_sum(
        variaveis,
        (
            ("MCUL3901", 2),
            ("MCUL3902", 2),
            ("MCUL3903", 2),
            ("MCUL3904", 2),
            ("MCUL3905", 2),
            ("MCUL3906", 2),
            ("MCUL3907", 2),
            ("MCUL3908", 1),
            ("MCUL3909", 1),
            ("MCUL3910", 1),
            ("MCUL3911", 1),
            ("MCUL3912", 1),
            ("MCUL3913", 1),
            ("MCUL3914", 1),
            ("MCUL3916", 1),
            ("MCUL3917", 1),
            ("MCUL3918", 1),
            ("MCUL3919", 1),
            ("MCUL40", 2),
        ),
        missing_as_zero=True,
    )


SPEC = IndicatorSpec(
    "3077",
    "sociocultural",
    "cultura",
    "Somatoria (MCUL3901*2+MCUL3902*2+MCUL3903*2+MCUL3904*2+MCUL3905*2+MCUL3906*2+MCUL3907*2+MCUL3908*1+MCUL3909*1+MCUL3910*1+MCUL3911*1+MCUL3912*1+MCUL3913*1+MCUL3914*1+MCUL3916*1+MCUL3917*1+MCUL3918*1+MCUL3919*1+MCUL40*2)",
    (
        "MCUL3901",
        "MCUL3902",
        "MCUL3903",
        "MCUL3904",
        "MCUL3905",
        "MCUL3906",
        "MCUL3907",
        "MCUL3908",
        "MCUL3909",
        "MCUL3910",
        "MCUL3911",
        "MCUL3912",
        "MCUL3913",
        "MCUL3914",
        "MCUL3916",
        "MCUL3917",
        "MCUL3918",
        "MCUL3919",
        "MCUL40",
    ),
    _calc
)
