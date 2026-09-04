from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MTIP11": 3,
    "MTIP121": 1,
    "MTIP122": 1,
    "MTIP123": 1,
}

TEXTOS_VARIAVEIS = {
    "MTIP11": "O munic\u00edpio desenvolve a\u00e7\u00f5es, programas ou projetos de cr\u00e9dito, microcr\u00e9dito e seguro",
    "MTIP121": "A\u00e7\u00f5es para promover o acesso a microcr\u00e9dito produtivo orientado",
    "MTIP122": "A\u00e7\u00f5es de acesso a cr\u00e9dito por meio do Banco do Povo ou outras organiza\u00e7\u00f5es cong\u00eaneres",
    "MTIP123": "A\u00e7\u00f5es de acesso a cr\u00e9dito do Proger urbano",
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
    "4032",
    "economica",
    "inovacao",
    "Somatoria(MTIP11*3 + MTIP121*1 + MTIP122*1 + MTIP123*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
