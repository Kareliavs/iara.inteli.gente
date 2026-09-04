from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MGOV06": 1,
    "MGOV061": 1,
    "MGOV0712": 1,
    "MGOV0721": 1,
    "MGOV0731": 1,
    "MGOV0741": 1,
    "MGOV0751": 1,
    "MGOV0761": 1,
    "MGOV0771": 1,
}

TEXTOS_VARIAVEIS = {
    "MGOV06": "Disponibiliza\u00e7\u00e3o de informa\u00e7\u00f5es pormenorizadas sobre execu\u00e7\u00e3o or\u00e7ament\u00e1ria e financeira (em atendimento \u00e0 Lei Complementar 131/2009)",
    "MGOV061": "Disponibiliza informa\u00e7\u00f5es em tempo real",
    "MGOV0712": "Publica\u00e7\u00e3o dos dados gerais da administra\u00e7\u00e3o estadual em CSV, ODS, XLS, DOC",
    "MGOV0721": "Dados de receitas s\u00e3o publicados em CSV, ODS, XLS, DOC",
    "MGOV0731": "Despesas publicadas em CSV, ODS, XLS, DOC",
    "MGOV0741": "Dados de balan\u00e7os s\u00e3o publicados em CSV, ODS, XLS, DOC",
    "MGOV0751": "Dados de presta\u00e7\u00e3o de contas da Lei de Responsabilidade Fiscal s\u00e3o publicados em CSV, ODS, XLS, DOC",
    "MGOV0761": "Dados de compras e licita\u00e7\u00f5es s\u00e3o publicados em CSV, ODS, XLS, DOC",
    "MGOV0771": "Dados individualizados das remunera\u00e7\u00f5es e subs\u00eddios recebidos pelos servidores do governo estadual em CSV, ODS, XLS, DOC",
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
        if usadas.get(sigla, 0) == 1
    ]
    return valor, usadas, "; ".join(textos_ativos)


SPEC = IndicatorSpec(
    "6037",
    "capacidades_institucionais",
    "dados_abertos",
    "Somatoria(MGOV06*1 + MGOV061*1 + MGOV0712*1 + MGOV0721*1 + MGOV0731*1 + MGOV0741*1 + MGOV0751*1 + MGOV0761*1 + MGOV0771*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
