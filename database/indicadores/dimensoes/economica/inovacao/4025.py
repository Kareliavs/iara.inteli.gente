from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MTIP09": 3,
    "MTIP101": 1,
    "MTIP102": 1,
    "MTIP103": 1,
    "MTIP104": 1,
    "MTIP105": 1,
    "MTIP106": 1,
}

TEXTOS_VARIAVEIS = {
    "MTIP09": "O munic\u00edpio desenvolve a\u00e7\u00f5es, programas ou projetos de inclus\u00e3o produtiva urbana",
    "MTIP101": "A\u00e7\u00f5es de fomento a empreendimentos individuais urbanos",
    "MTIP102": "A\u00e7\u00f5es fomento a empreendimentos coletivos urbanos (Associativismo, Cooperativismo e Economia Solid\u00e1ria urbana e outros grupos n\u00e3o formalizados)",
    "MTIP103": "A\u00e7\u00f5es de assist\u00eancia t\u00e9cnico-gerencial a empreendimentos individuais urbanos (para formaliza\u00e7\u00e3o, melhora da produ\u00e7\u00e3o, aspectos jur\u00eddicos e comerciais)",
    "MTIP104": "A\u00e7\u00f5es de incuba\u00e7\u00e3o de empreendimentos",
    "MTIP105": "A\u00e7\u00f5es de fomento ao artesanato",
    "MTIP106": "A\u00e7\u00f5es de doa\u00e7\u00e3o de equipamentos ou kit b\u00e1sico para desempenho do trabalho",
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
    "4025",
    "economica",
    "inovacao",
    "Somatoria(MTIP09*3 + MTIP101*1 + MTIP102*1 + MTIP103*1 + MTIP104*1 + MTIP105*1 + MTIP106*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
