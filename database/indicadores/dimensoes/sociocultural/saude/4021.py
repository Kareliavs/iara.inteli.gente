from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, ensure_pop, required, to_number



def _calc(variaveis: Variables):
    required(variaveis, ("NVBP", "NVPN", "NV"))
    nvbp = to_number(variaveis["NVBP"])
    nvpn = to_number(variaveis["NVPN"])
    nv = to_number(variaveis["NV"])
    ensure_pop(nv)
    valor = ((nvbp / nv) + (nvpn / nv)) / 2
    return valor, {"NVBP": nvbp, "NVPN": nvpn, "NV": nv}


SPEC = IndicatorSpec(
    "4021",
    "sociocultural",
    "saude",
    "{[(NVBP/NV)] + [(NVPN)/(NV)]}/2",
    ("NVBP", "NVPN", "NV"),
    _calc
)
