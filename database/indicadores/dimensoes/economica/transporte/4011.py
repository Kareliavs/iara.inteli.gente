from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MTIC261": 1,
    "MTIC262": 2,
    "MTIC265": 3,
}

TEXTOS_VARIAVEIS = {
    "MTIC261": "Bilhete eletr\u00f4nico transporte p\u00fablico",
    "MTIC262": "\u00d4nibus municipal com GPS",
    "MTIC265": "Sem\u00e1foros inteligentes",
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
    "4011",
    "economica",
    "transporte",
    "Somatoria(MTIC261*1 + MTIC262*2 + MTIC265*3)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
