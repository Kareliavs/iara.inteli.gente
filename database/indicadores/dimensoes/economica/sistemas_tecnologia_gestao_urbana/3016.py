from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MREG01": 1,
    "MREG02": 1,
    "MREG05": 1,
    "MREG011": 1,
    "MREG012": 1,
    "MREG013": 1,
    "MREG031": 1,
    "MREG051": 1,
}

TEXTOS_VARIAVEIS = {
    "MREG012": "Existe disponibilidade de dados ou sistemas do munic\u00edpio de forma georreferenciada",
    "MREG011": "Existe disponibilidade de dados ou sistemas do munic\u00edpio de forma informatizada",
    "MREG01": "Existem dados de bases cartogr\u00e1ficas do cadastro imobili\u00e1rio urbano",
    "MREG031": "Existem dados de planta gen\u00e9rica de valores",
    "MREG013": "Existe sistema de informa\u00e7\u00f5es do cadastro imobili\u00e1rio urbano na web ou em rede",
    "MREG02": "Existe cobran\u00e7a de IPTU no munic\u00edpio",
    "MREG05": "Existe cadastro ISSQN",
    "MREG051": "Existe ISSQN informatizado",
}


def _calc(variaveis: Variables):
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
    "3016",
    "economica",
    "sistemas_tecnologia_gestao_urbana",
    "Somatoria(MREG01*1 + MREG02*1 + MREG05*1 + MREG011*1 + MREG012*1 + MREG013*1 + MREG031*1 + MREG051*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
