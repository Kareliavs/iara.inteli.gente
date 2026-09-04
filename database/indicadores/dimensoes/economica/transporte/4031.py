from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MTRA21": 1,
    "MTRA221": 1,
    "MTRA222": 1,
    "MTRA223": 1,
}

TEXTOS_VARIAVEIS = {
    "MTRA21": "Frota de \u00f4nibus municipais adaptada para pessoas com defici\u00eancia ou mobilidade reduzida",
    "MTRA221": "Piso baixo",
    "MTRA222": "Piso alto com acesso realizado por plataforma de embarque/desembarque",
    "MTRA223": "Piso alto equipado com plataforma elevat\u00f3ria veicular",
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
    "4031",
    "economica",
    "transporte",
    "Somatoria(MTRA21*1 + MTRA221*1 + MTRA222*1 + MTRA223*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
