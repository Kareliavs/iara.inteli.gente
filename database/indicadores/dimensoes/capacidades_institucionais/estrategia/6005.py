from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "F19_1IETIEXP": 2,
    "F19_2MLIOTBD": 2,
    "F19_3POSTHSOLTEC": 2,
    "F19LPRITIC": 2,
    "F19_4NRATIV": 0,
}

TEXTOS_VARIAVEIS = {
    "F19_1IETIEXP": "Identifica\u00e7\u00e3o da infraestrutura e recursos de TI necess\u00e1rios para expans\u00e3o",
    "F19_2MLIOTBD": "Planejamento de uso de tecnologias avan\u00e7adas, como IoT, IA, Machine learning, Big Data",
    "F19_3POSTHSOLTEC": "Participa\u00e7\u00e3o de outros atores no mercado de oferta de solu\u00e7\u00f5es tecnol\u00f3gicas",
    "F19_4NRATIV": "N\u00e3o realiza atividades",
    "F19LPRITIC": "Levantamento das prioridades, por \u00e1rea, para investimento em TIC",
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
    "6005",
    "capacidades_institucionais",
    "estrategia",
    "Somatoria(F19_1IETIEXP*2 + F19_2MLIOTBD*2 + F19_3POSTHSOLTEC*2 + F19LPRITIC*2 + F19_4NRATIV*0)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
