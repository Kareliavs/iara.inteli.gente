from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MTRA085": 1,
    "MTRA24": 2,
    "MTRA25": 1,
}

TEXTOS_VARIAVEIS = {
    "MTRA085": "Plano Municipal de Transporte contempla o uso pelo pedestre e pelo ciclista do espa\u00e7o vi\u00e1rio de uso p\u00fablico",
    "MTRA24": "Ciclovia no munic\u00edpio",
    "MTRA25": "Biciclet\u00e1rio no munic\u00edpio",
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
    indicador_texto = "; ".join(textos_ativos)

    return valor, usadas, indicador_texto


SPEC = IndicatorSpec(
    "4046",
    "economica",
    "transporte",
    "Somatoria(MTRA085*1 + MTRA24*2 + MTRA25*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
