from __future__ import annotations

from typing import Callable, Dict, Optional

from indicadores.core.types import Number

from .maturidade_3003 import calcular as calcular_maturidade_3003
from .maturidade_3006 import calcular as calcular_maturidade_3006
from .maturidade_3007 import calcular as calcular_maturidade_3007
from .maturidade_3011 import calcular as calcular_maturidade_3011
from .maturidade_3037 import calcular as calcular_maturidade_3037
from .maturidade_3039 import calcular as calcular_maturidade_3039
from .maturidade_3048 import calcular as calcular_maturidade_3048
from .maturidade_3077 import calcular as calcular_maturidade_3077
from .maturidade_3085 import calcular as calcular_maturidade_3085
from .maturidade_3086 import calcular as calcular_maturidade_3086
from .maturidade_3095 import calcular as calcular_maturidade_3095
from .maturidade_3096 import calcular as calcular_maturidade_3096
from .maturidade_3103 import calcular as calcular_maturidade_3103
from .maturidade_3147 import calcular as calcular_maturidade_3147
from .maturidade_3125 import calcular as calcular_maturidade_3125
from .maturidade_3115 import calcular as calcular_maturidade_3115
from .maturidade_3107 import calcular as calcular_maturidade_3107
from .maturidade_3123 import calcular as calcular_maturidade_3123
from .maturidade_4004 import calcular as calcular_maturidade_4004
from .maturidade_4006 import calcular as calcular_maturidade_4006
from .maturidade_4016 import calcular as calcular_maturidade_4016
from .maturidade_4017 import calcular as calcular_maturidade_4017
from .maturidade_4021 import calcular as calcular_maturidade_4021
from .maturidade_4020 import calcular as calcular_maturidade_4020
from .maturidade_4034 import calcular as calcular_maturidade_4034
from .maturidade_4037 import calcular as calcular_maturidade_4037
from .maturidade_4039 import calcular as calcular_maturidade_4039
from .maturidade_4040 import calcular as calcular_maturidade_4040
from .maturidade_4042 import calcular as calcular_maturidade_4042
from .maturidade_4043 import calcular as calcular_maturidade_4043
from .maturidade_4044 import calcular as calcular_maturidade_4044
from .maturidade_4049 import calcular as calcular_maturidade_4049
from .maturidade_4048 import calcular as calcular_maturidade_4048
from .maturidade_4067 import calcular as calcular_maturidade_4067
from .maturidade_4068 import calcular as calcular_maturidade_4068
from .maturidade_4069 import calcular as calcular_maturidade_4069

MATURITY_RULES: Dict[str, Callable[[Number], Optional[int]]] = {
    "3003": calcular_maturidade_3003,
    "3006": calcular_maturidade_3006,
    "3007": calcular_maturidade_3007,
    "3011": calcular_maturidade_3011,
    "3037": calcular_maturidade_3037,
    "3039": calcular_maturidade_3039,
    "3048": calcular_maturidade_3048,
    "3077": calcular_maturidade_3077,
    "3085": calcular_maturidade_3085,
    "3086": calcular_maturidade_3086,
    "3095": calcular_maturidade_3095,
    "3096": calcular_maturidade_3096,
    "3103": calcular_maturidade_3103,
    "3147": calcular_maturidade_3147,
    "3125": calcular_maturidade_3125,
    "3115": calcular_maturidade_3115,
    "3107": calcular_maturidade_3107,
    "3123": calcular_maturidade_3123,
    "4004": calcular_maturidade_4004,
    "4006": calcular_maturidade_4006,
    "4016": calcular_maturidade_4016,
    "4017": calcular_maturidade_4017,
    "4021": calcular_maturidade_4021,
    "4020": calcular_maturidade_4020,
    "4034": calcular_maturidade_4034,
    "4037": calcular_maturidade_4037,
    "4039": calcular_maturidade_4039,
    "4040": calcular_maturidade_4040,
    "4042": calcular_maturidade_4042,
    "4043": calcular_maturidade_4043,
    "4044": calcular_maturidade_4044,
    "4049": calcular_maturidade_4049,
    "4048": calcular_maturidade_4048,
    "4067": calcular_maturidade_4067,
    "4068": calcular_maturidade_4068,
    "4069": calcular_maturidade_4069,
}

__all__ = [
    "MATURITY_RULES",
    "calcular_maturidade_3003",
    "calcular_maturidade_3006",
    "calcular_maturidade_3007",
    "calcular_maturidade_3011",
    "calcular_maturidade_3037",
    "calcular_maturidade_3039",
    "calcular_maturidade_3048",
    "calcular_maturidade_3077",
    "calcular_maturidade_3085",
    "calcular_maturidade_3086",
    "calcular_maturidade_3095",
    "calcular_maturidade_3096",
    "calcular_maturidade_3103",
    "calcular_maturidade_3147",
    "calcular_maturidade_3125",
    "calcular_maturidade_3115",
    "calcular_maturidade_3107",
    "calcular_maturidade_3123",
    "calcular_maturidade_4004",
    "calcular_maturidade_4006",
    "calcular_maturidade_4016",
    "calcular_maturidade_4017",
    "calcular_maturidade_4021",
    "calcular_maturidade_4020",
    "calcular_maturidade_4034",
    "calcular_maturidade_4037",
    "calcular_maturidade_4039",
    "calcular_maturidade_4040",
    "calcular_maturidade_4042",
    "calcular_maturidade_4043",
    "calcular_maturidade_4044",
    "calcular_maturidade_4049",
    "calcular_maturidade_4048",
    "calcular_maturidade_4067",
    "calcular_maturidade_4068",
    "calcular_maturidade_4069",
]
