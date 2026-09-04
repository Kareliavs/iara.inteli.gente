from typing import Callable, Optional

from .calculator import (
    INDICATOR_SPECS,
    calculate_indicator,
    calculate_many,
    list_indicator_ids,
    required_siglas,
)
from .core.types import Number
from .dimensoes.capacidades_institucionais.maturidade import MATURITY_RULES as CAPACIDADES_INSTITUCIONAIS_MATURITY_RULES
from .dimensoes.economica.maturidade import MATURITY_RULES as ECONOMICA_MATURITY_RULES
from .dimensoes.economica.maturidade import calcular_nivel_maturidade as calcular_nivel_maturidade_economica
from .dimensoes.meio_ambiente.maturidade import MATURITY_RULES as MEIO_AMBIENTE_MATURITY_RULES
from .dimensoes.sociocultural.maturidade import MATURITY_RULES as SOCIOCULTURAL_MATURITY_RULES

MATURITY_RULES = {
    **CAPACIDADES_INSTITUCIONAIS_MATURITY_RULES,
    **ECONOMICA_MATURITY_RULES,
    **MEIO_AMBIENTE_MATURITY_RULES,
    **SOCIOCULTURAL_MATURITY_RULES,
}


def calcular_nivel_maturidade(
    indicator_id: str,
    indicador: Number,
    fallback_level_fn: Optional[Callable[[Number], Optional[int]]] = None,
    conn=None,
    municipio_cod_ibge: Optional[int] = None,
    ano: Optional[int] = None,
) -> Optional[int]:
    nivel = calcular_nivel_maturidade_economica(
        indicator_id,
        indicador,
        fallback_level_fn,
        conn=conn,
        municipio_cod_ibge=municipio_cod_ibge,
        ano=ano,
    )
    if nivel is not None:
        return nivel

    level_fn = SOCIOCULTURAL_MATURITY_RULES.get(indicator_id)
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

    level_fn = MEIO_AMBIENTE_MATURITY_RULES.get(indicator_id)
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

    level_fn = CAPACIDADES_INSTITUCIONAIS_MATURITY_RULES.get(indicator_id)
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

    return None


def _executar_level_fn(
    level_fn: Callable[[Number], Optional[int]],
    indicador: Number,
    conn=None,
    municipio_cod_ibge: Optional[int] = None,
    ano: Optional[int] = None,
) -> Optional[int]:
    import inspect

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
    "INDICATOR_SPECS",
    "calculate_indicator",
    "calculate_many",
    "list_indicator_ids",
    "required_siglas",
    "MATURITY_RULES",
    "calcular_nivel_maturidade",
]
