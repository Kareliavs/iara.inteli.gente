from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, ensure_pop, required, to_number



def _calc(variaveis: Variables):
    required(variaveis, ("NV",))
    nogrvpa = to_number(variaveis.get("NOGRVPA", 0), default=0.0)
    mpue = to_number(variaveis.get("MPUE", 0), default=0.0)
    nv = to_number(variaveis["NV"])
    ensure_pop(nv)
    valor = ((nogrvpa + mpue) / nv) * 100000
    return valor, {"NOGRVPA": nogrvpa, "MPUE": mpue, "NV": nv}


SPEC = IndicatorSpec(
    "4049",
    "sociocultural",
    "saude",
    "((NOGRVPA + MPUE)/NV)*100000",
    ("NOGRVPA", "MPUE", "NV"),
    _calc
)
