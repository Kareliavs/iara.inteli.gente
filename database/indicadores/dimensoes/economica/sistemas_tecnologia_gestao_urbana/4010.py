from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MTIC08": 1,
    "MTIC263": 1,
    "MTIC264": 1,
    "MTIC266": 1,
}

TEXTOS_VARIAVEIS = {
    "MTIC08": "Centro de processamento de dados (CPD) - exist\u00eancia",
    "MTIC263": "Centro de controle operacional",
    "MTIC264": "Sistema de ilumina\u00e7\u00e3o inteligente que permite a medi\u00e7\u00e3o de consumo de energia ou altera\u00e7\u00e3o \u00e0 dist\u00e2ncia da ilumina\u00e7\u00e3o de \u00e1reas do munic\u00edpio",
    "MTIC266": "Sensores para monitoramento de \u00e1reas com risco de enchentes, alagamentos ou outros desastres naturais",
}


def _calc(variaveis: Variables):
    if not any(sigla in variaveis for sigla in PESOS_VARIAVEIS):
        raise ValueError("Nenhuma variavel do indicador 4010 encontrada no ano")

    usadas = {
        sigla: to_number(variaveis.get(sigla, 0), default=0.0)
        for sigla in PESOS_VARIAVEIS
    }

    valor = sum(usadas.values())
    textos_ativos = [
        texto
        for sigla, texto in TEXTOS_VARIAVEIS.items()
        if usadas[sigla] == 1
    ]

    return valor, usadas, "; ".join(textos_ativos)


SPEC = IndicatorSpec(
    "4010",
    "economica",
    "sistemas_tecnologia_gestao_urbana",
    "Somatoria(MTIC08*1 + MTIC263*1 + MTIC264*1 + MTIC266*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
