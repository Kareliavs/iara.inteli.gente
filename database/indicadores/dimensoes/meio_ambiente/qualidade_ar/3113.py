from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number

PESOS_VARIAVEIS = {
    "F9_1VV": 1,
    "F9_2TEMP": 1,
    "F9_3PRECPLUV": 1,
    "F9FUM": 1,
}

TEXTOS_VARIAVEIS = {
    "F9_1VV": "Monitora as informa\u00e7\u00f5es sobre dire\u00e7\u00e3o e velocidade do vento",
    "F9_2TEMP": "Monitora as informa\u00e7\u00f5es sobre a temperatura do ar",
    "F9_3PRECPLUV": "Monitora as informa\u00e7\u00f5es sobre precipita\u00e7\u00e3o pluviom\u00e9trica",
    "F9FUM": "Monitora as informa\u00e7\u00f5es e medi\u00e7\u00f5es de fuma\u00e7a",
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
    "3113",
    "meio_ambiente",
    "qualidade_ar",
    "Somatoria(F9_1VV*1 + F9_2TEMP*1 + F9_3PRECPLUV*1 + F9FUM*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
