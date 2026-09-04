from __future__ import annotations

import inspect
from typing import Callable, Dict, Optional

from indicadores.core.types import Number

from .maturidade_3004 import calcular as calcular_maturidade_3004
from .maturidade_3016 import calcular as calcular_maturidade_3016
from .maturidade_3020 import calcular as calcular_maturidade_3020
from .maturidade_3021 import calcular as calcular_maturidade_3021
from .maturidade_3022 import calcular as calcular_maturidade_3022
from .maturidade_3033 import calcular as calcular_maturidade_3033
from .maturidade_3040 import calcular as calcular_maturidade_3040
from .maturidade_3041 import calcular as calcular_maturidade_3041
from .maturidade_3076 import calcular as calcular_maturidade_3076
from .maturidade_3117 import calcular as calcular_maturidade_3117
from .maturidade_3122 import calcular as calcular_maturidade_3122
from .maturidade_3124 import calcular as calcular_maturidade_3124
from .maturidade_3127 import calcular as calcular_maturidade_3127
from .maturidade_3134 import calcular as calcular_maturidade_3134
from .maturidade_3139 import calcular as calcular_maturidade_3139
from .maturidade_3141 import calcular as calcular_maturidade_3141
from .maturidade_3145 import calcular as calcular_maturidade_3145
from .maturidade_3148 import calcular as calcular_maturidade_3148
from .maturidade_4005 import calcular as calcular_maturidade_4005
from .maturidade_4010 import calcular as calcular_maturidade_4010
from .maturidade_4011 import calcular as calcular_maturidade_4011
from .maturidade_4012 import calcular as calcular_maturidade_4012
from .maturidade_4024 import calcular as calcular_maturidade_4024
from .maturidade_4025 import calcular as calcular_maturidade_4025
from .maturidade_4031 import calcular as calcular_maturidade_4031
from .maturidade_4032 import calcular as calcular_maturidade_4032
from .maturidade_4033 import calcular as calcular_maturidade_4033
from .maturidade_4035 import calcular as calcular_maturidade_4035
from .maturidade_4036 import calcular as calcular_maturidade_4036
from .maturidade_4041 import calcular as calcular_maturidade_4041
from .maturidade_4045 import calcular as calcular_maturidade_4045
from .maturidade_4046 import calcular as calcular_maturidade_4046
from .maturidade_4065 import calcular as calcular_maturidade_4065
from .maturidade_4066 import calcular as calcular_maturidade_4066

from .maturidade_3049 import calcular as calcular_maturidade_3049

# Regras de maturidade centralizadas da dimensao economica por indicador_referencia.
MATURITY_RULES: Dict[str, Callable[[Number], Optional[int]]] = {
    "3004": calcular_maturidade_3004,
    "3016": calcular_maturidade_3016,
    "3020": calcular_maturidade_3020,
    "3021": calcular_maturidade_3021,
    "3022": calcular_maturidade_3022,
    "3033": calcular_maturidade_3033,
    "3040": calcular_maturidade_3040,
    "3041": calcular_maturidade_3041,
    "3076": calcular_maturidade_3076,
    "3117": calcular_maturidade_3117,
    "3122": calcular_maturidade_3122,
    "3124": calcular_maturidade_3124,
    "3127": calcular_maturidade_3127,
    "3134": calcular_maturidade_3134,
    "3139": calcular_maturidade_3139,
    "3141": calcular_maturidade_3141,
    "3145": calcular_maturidade_3145,
    "3148": calcular_maturidade_3148,
    "4005": calcular_maturidade_4005,
    "4010": calcular_maturidade_4010,
    "4011": calcular_maturidade_4011,
    "4012": calcular_maturidade_4012,
    "4024": calcular_maturidade_4024,
    "4025": calcular_maturidade_4025,
    "4031": calcular_maturidade_4031,
    "4032": calcular_maturidade_4032,
    "4033": calcular_maturidade_4033,
    "4035": calcular_maturidade_4035,
    "4036": calcular_maturidade_4036,
    "4041": calcular_maturidade_4041,
    "4045": calcular_maturidade_4045,
    "4046": calcular_maturidade_4046,
    "4065": calcular_maturidade_4065,
    "4066": calcular_maturidade_4066,
    "3049": calcular_maturidade_3049,
}


def calcular_nivel_maturidade(
    indicator_id: str,
    indicador: Number,
    fallback_level_fn: Optional[Callable[[Number], Optional[int]]] = None,
    conn=None,
    municipio_cod_ibge: Optional[int] = None,
    ano: Optional[int] = None,
) -> Optional[int]:
    level_fn = MATURITY_RULES.get(indicator_id)
    if level_fn is not None:
        nivel = _executar_level_fn(
            level_fn,
            indicador,
            conn=conn,
            municipio_cod_ibge=municipio_cod_ibge,
            ano=ano,
        )
        if nivel is not None:
            return nivel

    if fallback_level_fn is not None:
        return _executar_level_fn(
            fallback_level_fn,
            indicador,
            conn=conn,
            municipio_cod_ibge=municipio_cod_ibge,
            ano=ano,
        )

    return None


def _executar_level_fn(
    level_fn: Callable[[Number], Optional[int]],
    indicador: Number,
    conn=None,
    municipio_cod_ibge: Optional[int] = None,
    ano: Optional[int] = None,
) -> Optional[int]:
    params = inspect.signature(level_fn).parameters
    kwargs = {}
    if "conn" in params:
        kwargs["conn"] = conn
    if "municipio_cod_ibge" in params:
        kwargs["municipio_cod_ibge"] = municipio_cod_ibge
    if "ano" in params:
        kwargs["ano"] = ano
    return level_fn(indicador, **kwargs)
