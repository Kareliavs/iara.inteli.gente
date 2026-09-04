from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MTRA181": 1,
    "MTRA182": 3,
    "MTRA183": 2,
    "MTRA184": 2,
    "MTRA185": 3,
    "MTRA186": 1,
    "MTRA187": 1,
    "MTRA19": 3,
    "MTRA23": 1,
}

TEXTOS_VARIAVEIS = {
    "MTRA181": "Barco",
    "MTRA182": "Metr\u00f4",
    "MTRA183": "Motot\u00e1xi",
    "MTRA184": "T\u00e1xi",
    "MTRA185": "Trem",
    "MTRA186": "Van",
    "MTRA187": "Avi\u00e3o",
    "MTRA19": "Transporte coletivo por \u00f4nibus intramunicipal",
    "MTRA23": "Transporte coletivo por \u00f4nibus intermunicipal",
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
    "3124",
    "economica",
    "transporte",
    "Somatoria(MTRA181*1 + MTRA182*3 + MTRA183*2 + MTRA184*2 + MTRA185*3 + MTRA186*1 + MTRA187*1 + MTRA19*3 + MTRA23*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
