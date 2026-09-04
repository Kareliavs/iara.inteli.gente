from __future__ import annotations

import inspect
from typing import Callable, Dict, Optional

from indicadores.core.types import Number

from .maturidade_6037 import calcular as calcular_maturidade_6037
from .maturidade_6038 import calcular as calcular_maturidade_6038
from .maturidade_6035 import calcular as calcular_maturidade_6035
from .maturidade_6044 import calcular as calcular_maturidade_6044
from .maturidade_6048 import calcular as calcular_maturidade_6048
from .maturidade_6054 import calcular as calcular_maturidade_6054
from .maturidade_6055 import calcular as calcular_maturidade_6055
from .maturidade_6056 import calcular as calcular_maturidade_6056
from .maturidade_6003 import calcular as calcular_maturidade_6003
from .maturidade_6005 import calcular as calcular_maturidade_6005
from .maturidade_6006 import calcular as calcular_maturidade_6006
from .maturidade_6009 import calcular as calcular_maturidade_6009
from .maturidade_6021 import calcular as calcular_maturidade_6021
from .maturidade_6024 import calcular as calcular_maturidade_6024

MATURITY_RULES: Dict[str, Callable[[Number], Optional[int]]] = {
    "6003": calcular_maturidade_6003,
    "6005": calcular_maturidade_6005,
    "6006": calcular_maturidade_6006,
    "6009": calcular_maturidade_6009,
    "6021": calcular_maturidade_6021,
    "6024": calcular_maturidade_6024,
    "6035": calcular_maturidade_6035,
    "6037": calcular_maturidade_6037,
    "6038": calcular_maturidade_6038,
    "6044": calcular_maturidade_6044,
    "6048": calcular_maturidade_6048,
    "6054": calcular_maturidade_6054,
    "6055": calcular_maturidade_6055,
    "6056": calcular_maturidade_6056,
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
    "calcular_maturidade_6003",
    "calcular_maturidade_6005",
    "calcular_maturidade_6006",
    "calcular_maturidade_6009",
    "calcular_maturidade_6021",
    "calcular_maturidade_6024",
    "calcular_maturidade_6035",
    "calcular_maturidade_6037",
    "calcular_maturidade_6038",
    "calcular_maturidade_6044",
    "calcular_maturidade_6048",
    "calcular_maturidade_6054",
    "calcular_maturidade_6055",
    "calcular_maturidade_6056",
]
