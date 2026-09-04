from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MEDU114": 3,
    "MASS2411": 3,
    "MASS2418": 2,
    "MASS2614": 1,
}

TEXTOS_VARIAVEIS = {
    "MEDU114": "Combate \u00e0 viol\u00eancia nas escolas",
    "MASS2411": "Servi\u00e7o de Prote\u00e7\u00e3o Social a Adolescentes em Cumprimento de Medida Socioeducativa de Liberdade Assistida (LA) e de Presta\u00e7\u00e3o de Servi\u00e7os \u00e0 Comunidade (PSC)",
    "MASS2418": "Servi\u00e7o de Acolhimento Institucional para mulheres em situa\u00e7\u00e3o de viol\u00eancia",
    "MASS2614": "Encarcerado/egressos do sistema carcer\u00e1rio",
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
    "4017",
    "sociocultural",
    "seguranca_publica",
    "Somatoria (MEDU114*3+MASS2411*3+MASS2418*2+MASS2614*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
