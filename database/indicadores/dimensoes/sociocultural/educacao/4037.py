from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, ensure_pop, required, to_number



def _calc(variaveis: Variables):
    required(variaveis, ("IN_INTERNET", "ESC_MUN"))
    internet = to_number(variaveis["IN_INTERNET"])
    esc_mun = to_number(variaveis["ESC_MUN"])
    ensure_pop(esc_mun)
    return (internet / esc_mun) * 100, {"IN_INTERNET": internet, "ESC_MUN": esc_mun}


SPEC = IndicatorSpec(
    "4037",
    "sociocultural",
    "educacao",
    "(IN_INTERNET/ESC_MUN)*100",
    ("IN_INTERNET", "ESC_MUN"),
    _calc
)
