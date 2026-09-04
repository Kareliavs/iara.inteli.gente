from __future__ import annotations

import inspect
from typing import Callable, Dict, Optional

from indicadores.core.types import Number

from .maturidade_3024 import calcular as calcular_maturidade_3024
from .maturidade_3028 import calcular as calcular_maturidade_3028
from .maturidade_3042 import calcular as calcular_maturidade_3042
from .maturidade_3043 import calcular as calcular_maturidade_3043
from .maturidade_3056 import calcular as calcular_maturidade_3056
from .maturidade_3057 import calcular as calcular_maturidade_3057
from .maturidade_3069 import calcular as calcular_maturidade_3069
from .maturidade_3110 import calcular as calcular_maturidade_3110
from .maturidade_3113 import calcular as calcular_maturidade_3113
from .maturidade_3128 import calcular as calcular_maturidade_3128
from .maturidade_4007 import calcular as calcular_maturidade_4007
from .maturidade_4014 import calcular as calcular_maturidade_4014
from .maturidade_4030 import calcular as calcular_maturidade_4030
from .maturidade_4047 import calcular as calcular_maturidade_4047
from .maturidade_4070 import calcular as calcular_maturidade_4070
from .maturidade_4071 import calcular as calcular_maturidade_4071

MATURITY_RULES: Dict[str, Callable[[Number], Optional[int]]] = {
    "3024": calcular_maturidade_3024,
    "3028": calcular_maturidade_3028,
    "3042": calcular_maturidade_3042,
    "3043": calcular_maturidade_3043,
    "3056": calcular_maturidade_3056,
    "3057": calcular_maturidade_3057,
    "3069": calcular_maturidade_3069,
    "3110": calcular_maturidade_3110,
    "3113": calcular_maturidade_3113,
    "3128": calcular_maturidade_3128,
    "4007": calcular_maturidade_4007,
    "4014": calcular_maturidade_4014,
    "4030": calcular_maturidade_4030,
    "4047": calcular_maturidade_4047,
    "4070": calcular_maturidade_4070,
    "4071": calcular_maturidade_4071,
}


def calcular_nivel_maturidade(
    indicator_id: str,
    indicador: Number,
    fallback_level_fn=None,
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


__all__ = [
    "MATURITY_RULES",
    "calcular_nivel_maturidade",
    "calcular_maturidade_3024",
    "calcular_maturidade_3028",
    "calcular_maturidade_3042",
    "calcular_maturidade_3043",
    "calcular_maturidade_3056",
    "calcular_maturidade_3057",
    "calcular_maturidade_3069",
    "calcular_maturidade_3110",
    "calcular_maturidade_3113",
    "calcular_maturidade_3128",
    "calcular_maturidade_4007",
    "calcular_maturidade_4014",
    "calcular_maturidade_4030",
    "calcular_maturidade_4047",
    "calcular_maturidade_4070",
    "calcular_maturidade_4071",
]
