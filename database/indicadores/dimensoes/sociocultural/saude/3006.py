from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "F1_1EAD": 1,
    "F1_2APD": 1,
    "F1_3MRP": 2,
    "F1_4TC": 1,
    "F1_5SOF": 2,
    "F1_6TD": 2,
    "F1NSNPNEND": 0,
}

TEXTOS_VARIAVEIS = {
    "F1_1EAD": "Educa\u00e7\u00e3o \u00e0 dist\u00e2ncia em sa\u00fade",
    "F1_2APD": "Atividades de pesquisa \u00e0 dist\u00e2ncia",
    "F1_3MRP": "Monitoramento remoto de pacientes",
    "F1_4TC": "Servi\u00e7os de teleconsultoria",
    "F1_5SOF": "Servi\u00e7os de segunda opini\u00e3o formativa",
    "F1_6TD": "Servi\u00e7os de telediagn\u00f3stico",
    "F1NSNPNEND": "N\u00e3o sabe, N\u00e3o possui, N\u00e3o dispon\u00edvel",
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
    "3006",
    "sociocultural",
    "saude",
    "Somatoria(F1_1EAD*1 + F1_2APD*1 + F1_3MRP*2 + F1_4TC*1 + F1_5SOF*2 + F1_6TD*2 + F1NSNPNEND*0)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
