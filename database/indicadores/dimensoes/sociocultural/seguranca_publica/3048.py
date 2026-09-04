from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "F4_1SMS": 1,
    "F4_2SVI": 1,
    "F4_3SGPS": 1,
    "F4_4DR": 1,
    "F4SVM": 1,
}

TEXTOS_VARIAVEIS = {
    "F4_1SMS": "Sistema de monitoramento por sensores (sensores de ru\u00eddo de tiro, sensor de invas\u00e3o)",
    "F4_2SVI": "Sistemas de videomonitoramento integrado",
    "F4_3SGPS": "Sistemas de monitoramento por GPS (localiza\u00e7\u00e3o de viaturas etc)",
    "F4_4DR": "Drones",
    "F4SVM": "Sistema de videomonitoramento (C\u00e2mera de monitoramento, C\u00e2mera inteligente, C\u00e2mera OCR (an\u00e1lise de imagem)",
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
    "3048",
    "sociocultural",
    "seguranca_publica",
    "Somatoria(F4_1SMS*1 + F4_2SVI*1 + F4_3SGPS*1 + F4_4DR*1 + F4SVM*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
