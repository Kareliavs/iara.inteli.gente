from indicadores.core import IndicatorSpec, Variables, to_number


TEXTOS_VARIAVEIS = {
    "MHAB18": "Cadastro ou levantamento de fam\u00edlias interessadas em programas habitacionais",
    "MHAB182": "O cadastro \u00e9 informatizado",
    "MHAB183": "O cadastro inclui a natureza do benef\u00edcio habitacional pretendido pelas fam\u00edlias",
    "MHAB201": "Constru\u00e7\u00e3o de unidades habitacionais",
    "MHAB202": "Aquisi\u00e7\u00e3o de unidades habitacionais",
    "MHAB203": "Melhoria de unidades habitacionais",
    "MHAB204": "Oferta de material de constru\u00e7\u00e3o",
    "MHAB205": "Oferta de lotes",
    "MHAB206": "Regulariza\u00e7\u00e3o fundi\u00e1ria",
    "MHAB207": "Urbaniza\u00e7\u00e3o de assentamentos",
    "MHAB21": "A prefeitura tem algum programa que conceda o benef\u00edcio do aluguel social",
}


def _calc(variaveis: Variables):
    usadas = {
        sigla: to_number(variaveis.get(sigla, 0), default=0.0)
        for sigla in TEXTOS_VARIAVEIS
    }

    valor = sum(usadas.values())
    textos_ativos = [
        texto
        for sigla, texto in TEXTOS_VARIAVEIS.items()
        if usadas[sigla] == 1
    ]
    indicador_texto = "; ".join(textos_ativos)

    return valor, usadas, indicador_texto


SPEC = IndicatorSpec(
    "4041",
    "economica",
    "habitacao",
    "Somatoria(MHAB18*1 + MHAB182*1 + MHAB183*1 + MHAB201*1 + MHAB202*1 + MHAB203*1 + MHAB204*1 + MHAB205*1 + MHAB206*1 + MHAB207*1 + MHAB21*1)",
    tuple(TEXTOS_VARIAVEIS.keys()),
    _calc,
)
