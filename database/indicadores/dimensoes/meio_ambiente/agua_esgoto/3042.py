from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "F2GT": 1,
    "F2_1DV": 3,
    "F2_2AppCA": 2,
}

TEXTOS_VARIAVEIS = {
    "F2_1DV": "Sistema de detec\u00e7\u00e3o de vazamento de \u00e1gua",
    "F2_2AppCA": "App para acompanhamento do consumo de \u00e1gua",
    "F2GT": "Central de gerenciamento da telemedi\u00e7\u00e3o",
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
    "3042",
    "meio_ambiente",
    "agua_esgoto",
    "Somatoria(F2GT*1 + F2_1DV*3 + F2_2AppCA*2)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
