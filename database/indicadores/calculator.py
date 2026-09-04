from __future__ import annotations

from typing import Dict, Iterable, List, Mapping, Optional

from .core import Variables
from .registry import INDICATOR_SPECS


INDICADOR_VALOR_TEXTUAL_IDS = frozenset(
    {
        "3049",
        "3076",
        "4012",
        "4006",
        "3123",
        "4040",
        "3006",
        "3125",
        "4004",
        "3048",
        "3042",
        "4014",
        "3056",
        "3113",
        "3043",
        "3069",
        "6003",
        "6005",
        "6006",
        "6021",
        "6024",
        "6048",
        "6009",
        "6054",
        "6035",
        "6002",
        "6011",
        "6017",
        "6019",
    }
)


def _resolve_indicator_id(indicator_id: str) -> str:
    return indicator_id


def list_indicator_ids() -> List[str]:
    return sorted(INDICATOR_SPECS.keys())


def required_siglas(indicator_ids: Optional[Iterable[str]] = None) -> List[str]:
    ids = [_resolve_indicator_id(i) for i in (indicator_ids or INDICATOR_SPECS.keys())]
    siglas: set[str] = set()
    for indicator_id in ids:
        spec = INDICATOR_SPECS[indicator_id]
        siglas.update(spec.siglas)
    return sorted(siglas)


def calculate_indicator(
    indicator_id: str,
    municipio_cod_ibge: int,
    variaveis: Variables,
    variaveis_anos: Optional[Mapping[str, int]] = None,
) -> Dict[str, object]:
    indicator_id = _resolve_indicator_id(indicator_id)

    if indicator_id not in INDICATOR_SPECS:
        raise KeyError(f"Indicador nao mapeado: {indicator_id}")

    spec = INDICATOR_SPECS[indicator_id]
    calc_result = spec.calc_fn(variaveis)
    indicador, usadas = calc_result[:2]

    payload: Dict[str, object] = {
        "municipio_cod_ibge": municipio_cod_ibge,
        "dimensao": spec.dimensao,
        "topico": spec.subtopico,
        "indicador_id": spec.indicator_id,
        "nome_indicador": spec.indicator_id,
        "formula": spec.formula,
        "variaveis": usadas,
        "indicador": indicador,
    }

    if len(calc_result) > 2:
        text_field = (
            "indicador_valor_textual"
            if indicator_id in INDICADOR_VALOR_TEXTUAL_IDS
            else "indicador_texto"
        )
        payload[text_field] = calc_result[2]

    if variaveis_anos:
        anos_usados = {
            sigla: int(variaveis_anos[sigla])
            for sigla in usadas.keys()
            if sigla in variaveis_anos and variaveis_anos[sigla] is not None
        }
        if anos_usados:
            payload["anos_variaveis"] = anos_usados
    return payload


def calculate_many(
    municipio_cod_ibge: int,
    variaveis: Variables,
    indicator_ids: Optional[Iterable[str]] = None,
    variaveis_anos: Optional[Mapping[str, int]] = None,
) -> List[Dict[str, object]]:
    ids = list(indicator_ids) if indicator_ids is not None else list_indicator_ids()
    resultados: List[Dict[str, object]] = []
    for indicator_id in ids:
        resultados.append(
            calculate_indicator(indicator_id, municipio_cod_ibge, variaveis, variaveis_anos)
        )
    return resultados
