from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "F29DISPPUBLRESDIG": 1,
    "F29_1TOTDISPPORTDIG": 2,
    "F29_2TOTDISPTEMPREAL": 3,
    "F29_3NDISPPUBL": 0,
}

TEXTOS_VARIAVEIS = {
    "F29_1TOTDISPPORTDIG": "Resultados do monitoramento e avalia\u00e7\u00e3o s\u00e3o totalmente disponibilizados ao p\u00fablico em portal ou outro meio digital pela prefeitura",
    "F29_2TOTDISPTEMPREAL": "Resultados monitoramento avalia\u00e7\u00e3o totalmente disponibilizados em portal ou meio digital em tempo real, aberto e acompanhamento pelo cidad\u00e3o",
    "F29_3NDISPPUBL": "N\u00e3o s\u00e3o disponibilizados ao p\u00fablico",
    "F29DISPPUBLRESDIG": "Resultados do monitoramento e avalia\u00e7\u00e3o parcialmente disponibilizados em portal ou outro meio digital",
}


def _calc(variaveis: Variables):
    usadas = {
        sigla: to_number(variaveis.get(sigla, 0), default=0.0)
        for sigla in PESOS_VARIAVEIS
    }
    valor = sum(usadas[sigla] * peso for sigla, peso in PESOS_VARIAVEIS.items())
    textos_ativos = [
        texto for sigla, texto in TEXTOS_VARIAVEIS.items() if usadas.get(sigla, 0) == 1
    ]
    texto = "; ".join(textos_ativos) if textos_ativos else "Sem resposta do formul\u00e1rio"
    return valor, usadas, texto


SPEC = IndicatorSpec(
    "6054",
    "capacidades_institucionais",
    "monitoramento",
    "Somatoria(F29DISPPUBLRESDIG*1 + F29_1TOTDISPPORTDIG*2 + F29_2TOTDISPTEMPREAL*3 + F29_3NDISPPUBL*0)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
