from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "F10_1ED": 1,
    "F10_2PCPRJCULT": 1,
    "F10_3INSCPROJCULT": 1,
    "F10_4LINCPCULT": 1,
    "F10_5MAPCULT": 1,
    "F10CRGCULT": 1,
}

TEXTOS_VARIAVEIS = {
    "F10_1ED": "Servi\u00e7os para participar de editais de capta\u00e7\u00e3o de recursos culturais governamentais",
    "F10_2PCPRJCULT": "Servi\u00e7os de presta\u00e7\u00e3o de contas de projetos culturais com o governo",
    "F10_3INSCPROJCULT": "Servi\u00e7os para informa\u00e7\u00f5es e inscri\u00e7\u00f5es em confer\u00eancias e audi\u00eancias p\u00fablicas sobre cultura",
    "F10_4LINCPCULT": "Servi\u00e7os para informa\u00e7\u00f5es ou obten\u00e7\u00e3o de licen\u00e7as e permiss\u00f5es culturais",
    "F10_5MAPCULT": "Servi\u00e7os para cadastrar a institui\u00e7\u00e3o em sistemas de informa\u00e7\u00e3o ou mapeamento cultural",
    "F10CRGCULT": "Servi\u00e7os para informa\u00e7\u00f5es sobre editais de capta\u00e7\u00e3o de recursos culturais governamentais",
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
    "3123",
    "sociocultural",
    "cultura",
    "Somatoria(F10_1ED*1 + F10_2PCPRJCULT*1 + F10_3INSCPROJCULT*1 + F10_4LINCPCULT*1 + F10_5MAPCULT*1 + F10CRGCULT*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
