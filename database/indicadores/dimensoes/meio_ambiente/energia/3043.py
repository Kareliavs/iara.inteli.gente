from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number

PESOS_VARIAVEIS = {
    "F3CT": 1,
    "F3_1PE": 3,
    "F3_2AppCE": 2,
    "F3_3SLD": 3,
}

TEXTOS_VARIAVEIS = {
    "F3_1PE": "Sistema de detec\u00e7\u00e3o de perda de energia",
    "F3_2AppCE": "App para acompanhamento do consumo de energia",
    "F3_3SLD": "Sistema de ilumina\u00e7\u00e3o conectado a uma rede de comunica\u00e7\u00e3o (altera\u00e7\u00e3o de intensidade da luz \u00e0 dist\u00e2ncia)",
    "F3CT": "Central de gerenciamento da telemedi\u00e7\u00e3o",
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
    "3043",
    "meio_ambiente",
    "energia",
    "Somatoria(F3CT*1 + F3_1PE*3 + F3_2AppCE*2 + F3_3SLD*3)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
