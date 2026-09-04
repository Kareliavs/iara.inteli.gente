from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MTIP07": 3,
    "MTIP081": 1,
    "MTIP082": 1,
    "MTIP083": 1,
}

TEXTOS_VARIAVEIS = {
    "MTIP07": "O munic\u00edpio desenvolve a\u00e7\u00f5es, programas ou projetos de qualifica\u00e7\u00e3o profissional e intermedia\u00e7\u00e3o de m\u00e3o de obra",
    "MTIP081": "A\u00e7\u00f5es de qualifica\u00e7\u00e3o profissional",
    "MTIP082": "A\u00e7\u00f5es de intermedia\u00e7\u00e3o de m\u00e3o de obra",
    "MTIP083": "A\u00e7\u00f5es de mobiliza\u00e7\u00e3o e sensibiliza\u00e7\u00e3o para cursos de qualifica\u00e7\u00e3o profissional",
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
        if usadas[sigla] == 1
    ]

    return valor, usadas, "; ".join(textos_ativos)


SPEC = IndicatorSpec(
    "4024",
    "economica",
    "inovacao",
    "Somatoria(MTIP07*3 + MTIP081*1 + MTIP082*1 + MTIP083*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
