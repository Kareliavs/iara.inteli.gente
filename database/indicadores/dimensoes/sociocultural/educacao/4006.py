from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "F13_1ECCR": 1,
    "F13_2TECINF": 1,
    "F13_3ROBPROG": 1,
    "F13_4TRABEMPREE": 1,
    "F13_5PPPFORM": 1,
    "F13_6TELEC": 1,
    "F13INFBAS": 1,
}

TEXTOS_VARIAVEIS = {
    "F13_1ECCR": "Espa\u00e7os de forma\u00e7\u00e3o para economia criativa",
    "F13_2TECINF": "Espa\u00e7os de forma\u00e7\u00e3o para tecnologia da informa\u00e7\u00e3o",
    "F13_3ROBPROG": "Espa\u00e7os de forma\u00e7\u00e3o para rob\u00f3tica e programa\u00e7\u00e3o",
    "F13_4TRABEMPREE": "Espa\u00e7os de forma\u00e7\u00e3o para trabalho e empreendedorismo",
    "F13_5PPPFORM": "Espa\u00e7os de forma\u00e7\u00e3o com parcerias p\u00fablico-privada",
    "F13_6TELEC": "Espa\u00e7os de forma\u00e7\u00e3o via telecentro",
    "F13INFBAS": "Espa\u00e7os de forma\u00e7\u00e3o para inform\u00e1tica b\u00e1sica",
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
    "4006",
    "sociocultural",
    "educacao",
    "Somatoria(F13_1ECCR + F13_2TECINF + F13_3ROBPROG + F13_4TRABEMPREE + F13_5PPPFORM + F13_6TELEC + F13INFBAS)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
