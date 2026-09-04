from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MAGR151": 1,
    "MAGR152": 1,
    "MAGR153": 1,
    "MAGR154": 1,
    "MAGR155": 1,
}

TEXTOS_VARIAVEIS = {
    "MAGR151": "Agricultura org\u00e2nica",
    "MAGR152": "Agricultura familiar",
    "MAGR153": "Aquicultura",
    "MAGR154": "Pesca",
    "MAGR155": "Produ\u00e7\u00e3o de hortas comunit\u00e1rias",
}


def _calc(variaveis: Variables):
    usadas = {
        sigla: to_number(variaveis.get(sigla, 0), default=0.0)
        for sigla in PESOS_VARIAVEIS
    }
    valor = sum(usadas[sigla] * peso for sigla, peso in PESOS_VARIAVEIS.items())
    textos_ativos = [
        texto
        for sigla, texto in TEXTOS_VARIAVEIS.items()
        if usadas.get(sigla, 0) == 1
    ]
    return valor, usadas, "; ".join(textos_ativos)


SPEC = IndicatorSpec(
    "3057",
    "meio_ambiente",
    "areas_verdes",
    "Somatoria(MAGR151*1 + MAGR152*1 + MAGR153*1 + MAGR154*1 + MAGR155*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
