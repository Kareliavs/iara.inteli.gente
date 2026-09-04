from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MTIP13": 3,
    "MTIP141": 1,
    "MTIP142": 1,
}

TEXTOS_VARIAVEIS = {
    "MTIP13": "O munic\u00edpio desenvolve a\u00e7\u00f5es, programas ou projetos de gera\u00e7\u00e3o de trabalho e renda",
    "MTIP141": "Projeto(s) de apoio \u00e0 comercializa\u00e7\u00e3o de neg\u00f3cios, cooperativas e empreendimento solid\u00e1rios",
    "MTIP142": "Projeto(s) de apoio ao associativismo, cooperativismo e economia solid\u00e1ria",
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
    "4033",
    "economica",
    "inovacao",
    "Somatoria(MTIP13*3 + MTIP141*1 + MTIP142*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
