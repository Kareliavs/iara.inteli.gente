from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MMAM10": 1,
    "MMAM16": 1,
    "MMAM203": 1,
    "MMAM204": 1,
    "MMAM207": 1,
    "MMAM208": 1,
    "MMAM209": 1,
    "MMAM2012": 1,
}

TEXTOS_VARIAVEIS = {
    "MMAM10": "Conselho Municipal de Meio Ambiente ou similar",
    "MMAM16": "Existe \u00e1rea respons\u00e1vel pelo tema meio ambiente, disp\u00f5e de recursos financeiros espec\u00edficos para serem utilizados no desenvolvimento de suas a\u00e7\u00f5es",
    "MMAM203": "Legisla\u00e7\u00e3o ou instrumento de gest\u00e3o ambiental sobre gest\u00e3o de bacias hidrogr\u00e1ficas",
    "MMAM204": "Legisla\u00e7\u00e3o ou instrumento de gest\u00e3o ambiental sobre \u00e1rea e/ou zona de prote\u00e7\u00e3o ou controle ambiental",
    "MMAM207": "Legisla\u00e7\u00e3o ou instrumento de gest\u00e3o ambiental sobre permiss\u00e3o de atividades extrativas minerais",
    "MMAM208": "Legisla\u00e7\u00e3o ou instrumento de gest\u00e3o ambiental sobre fauna silvestre",
    "MMAM209": "Legisla\u00e7\u00e3o ou instrumento de gest\u00e3o ambiental sobre florestas",
    "MMAM2012": "Legisla\u00e7\u00e3o ou instrumento de gest\u00e3o ambiental sobre prote\u00e7\u00e3o \u00e0 biodiversidade",
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
    return valor, usadas, "; ".join(textos_ativos)


SPEC = IndicatorSpec(
    "4030",
    "meio_ambiente",
    "areas_verdes",
    "Somatoria(MMAM10*1 +MMAM16*1+MMAM203*1+MMAM204*1+MMAM207*1+MMAM208*1+MMAM209*1+MMAM2012*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
