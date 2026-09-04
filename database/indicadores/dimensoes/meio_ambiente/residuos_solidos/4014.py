from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number

PESOS_VARIAVEIS = {
    "F15_1COLGPS": 1,
    "F15_2GCRES": 1,
    "F15_3DFRESApp": 1,
    "F15MLP": 1,
}

TEXTOS_VARIAVEIS = {
    "F15_1COLGPS": "Existe sistema de acompanhamento das rotas para coleta via GPS",
    "F15_2GCRES": "Existem sistemas de gest\u00e3o da coleta de res\u00edduos",
    "F15_3DFRESApp": "Existem aplicativos para informa\u00e7\u00f5es sobre descarte e fluxo de res\u00edduos",
    "F15MLP": "Existe sistema de monitoramento de rejeitos em lixeiras p\u00fablicas",
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
    "4014",
    "meio_ambiente",
    "residuos_solidos",
    "Somatoria(F15_1COLGPS*1 + F15_2GCRES*1 + F15_3DFRESApp*1 + F15MLP*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
