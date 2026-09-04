from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "F12AC": 1,
    "F12_1AE": 1,
    "F12_2REXAM": 2,
    "F12_3VPE": 2,
    "F12_4IEM": 2,
}

TEXTOS_VARIAVEIS = {
    "F12_1AE": "Agendamento de exames",
    "F12_2REXAM": "Visualiza\u00e7\u00e3o de resultados de exames",
    "F12_3VPE": "Visualiza\u00e7\u00e3o de prontu\u00e1rios",
    "F12_4IEM": "Intera\u00e7\u00e3o com equipe m\u00e9dica",
    "F12AC": "Agendamento de consultas",
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
    "4004",
    "sociocultural",
    "saude",
    "Somatoria(F12AC*1 + F12_1AE*1 + F12_2REXAM*2 + F12_3VPE*2 + F12_4IEM*2)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
