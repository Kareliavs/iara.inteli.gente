from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "F8_1AppP": 1,
    "F8_2PPO": 1,
    "F8_3PPP": 1,
    "F8WS": 1,
}

TEXTOS_VARIAVEIS = {
    "F8_1AppP": "Por meio de aplicativo pr\u00f3prio",
    "F8_2PPO": "Painel de informa\u00e7\u00e3o em pontos de \u00f4nibus e/ou terminal",
    "F8_3PPP": "Por parceiros (Moovit, Google e outros)",
    "F8WS": "Site da prefeitura",
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
    texto = "; ".join(textos_ativos) if textos_ativos else "Sem resposta do formul\u00e1rio"
    return valor, usadas, texto


SPEC = IndicatorSpec(
    "3076",
    "economica",
    "transporte",
    "Somatoria(F8_1AppP*1 + F8_2PPO*1 + F8_3PPP*1 + F8WS*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
