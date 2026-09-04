from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MTIC272": 1,
    "MGOV0715": 1,
    "MGOV0725": 1,
    "MGOV0735": 1,
    "MGOV0745": 1,
    "MGOV0755": 1,
    "MGOV0765": 1,
    "MGOV0775": 1,
    "MTIC271": 1,
}

TEXTOS_VARIAVEIS = {
    "MTIC272": "Existe Portal de dados abertos",
    "MGOV0715": "Dados de or\u00e7amentos s\u00e3o publicados",
    "MGOV0725": "Dados de receitas s\u00e3o publicados",
    "MGOV0735": "Dados de despesas s\u00e3o publicados",
    "MGOV0745": "Dados de balan\u00e7os s\u00e3o publicados",
    "MGOV0755": "Dados de presta\u00e7\u00e3o de contas da Lei de Responsabilidade Fiscal s\u00e3o publicados",
    "MGOV0765": "Dados de compras e licita\u00e7\u00f5es s\u00e3o publicados",
    "MGOV0775": "Dados individualizados das remunera\u00e7\u00f5es de servidores s\u00e3o publicados",
    "MTIC271": "Existe disponibiliza\u00e7\u00e3o de portal da transpar\u00eancia",
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
    "3033",
    "economica",
    "dados_abertos",
    "Somatoria(MTIC271*1 + MTIC272*1 + MGOV0715*1 + MGOV0725*1 + MGOV0735*1 + MGOV0745*1 + MGOV0755*1 + MGOV0765*1 + MGOV0775*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
