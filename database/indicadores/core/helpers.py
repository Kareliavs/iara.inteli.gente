from __future__ import annotations

from typing import Sequence, Tuple, Optional

from .types import Number, Variables


def to_number(value: object, *, default: Optional[Number] = None) -> Number:
    try:
        n = float(value)
    except (TypeError, ValueError):
        if default is not None:
            return default
        raise ValueError(f"Valor nao numerico: {value!r}")
    return n


def required(variaveis: Variables, siglas: Sequence[str]) -> None:
    faltantes = [sigla for sigla in siglas if sigla not in variaveis]
    if faltantes:
        raise ValueError(f"Variaveis obrigatorias nao encontradas: {', '.join(faltantes)}")


def ensure_pop(pop: Number) -> None:
    if pop <= 0:
        raise ValueError("POP_TOT deve ser maior que zero")


def weighted_sum(
    variaveis: Variables,
    pesos: Sequence[Tuple[str, Number]],
    *,
    missing_as_zero: bool,
) -> Tuple[Number, Variables]:
    usadas: Variables = {}
    total = 0.0
    for sigla, peso in pesos:
        if missing_as_zero:
            valor = to_number(variaveis.get(sigla, 0.0), default=0.0)
        else:
            if sigla not in variaveis:
                raise ValueError(f"Variavel obrigatoria nao encontrada: {sigla}")
            valor = to_number(variaveis[sigla])
        usadas[sigla] = valor
        total += valor * peso
    return total, usadas
