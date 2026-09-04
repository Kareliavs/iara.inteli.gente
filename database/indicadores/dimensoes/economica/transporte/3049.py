from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "F5SCB": 2,
    "F5_1SCV": 1,
    "F5_2CVE": 1,
    "F5_3AppCP": 1,
}

TEXTOS_VARIAVEIS = {
    "F5_1SCV": "Servi\u00e7os de compartilhamento de ve\u00edculos",
    "F5_2CVE": "Servi\u00e7os de compartilhamento de ve\u00edculos el\u00e9tricos",
    "F5_3AppCP": "Aplicativos de compartilhamento oferecidos por iniciativas privadas",
    "F5SCB": "Servi\u00e7os de compartilhamento de bicicletas",
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
    "3049",
    "economica",
    "transporte",
    "Somatoria(F5SCB*2 + F5_1SCV*1 + F5_2CVE*1 + F5_3AppCP*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
