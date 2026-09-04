from __future__ import annotations

from dataclasses import dataclass
from typing import Callable, Dict, Optional, Tuple, Union

Number = float
Variables = Dict[str, Number]
IndicatorCalcResult = Union[
    Tuple[object, Variables],
    Tuple[object, Variables, Optional[str]],
]


@dataclass(frozen=True)
class IndicatorSpec:
    indicator_id: str
    dimensao: str
    subtopico: str
    formula: str
    siglas: Tuple[str, ...]
    calc_fn: Callable[[Variables], IndicatorCalcResult]
    level_fn: Optional[Callable[[Number], Optional[int]]] = None
