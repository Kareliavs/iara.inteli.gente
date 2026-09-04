from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MDHU12": 1,
    "MDHU18": 1,
    "MDHU24": 1,
    "MDHU30": 1,
    "MDHU36": 1,
    "MDHU42": 1,
    "MDHU48": 1,
    "MTIC252": 3,
}

TEXTOS_VARIAVEIS = {
    "MDHU12": "Conselho Municipal de Direitos Humanos - exist\u00eancia",
    "MDHU18": "Conselho Municipal de Direitos da Crian\u00e7a e do Adolescente - exist\u00eancia",
    "MDHU24": "Conselho Municipal de Direitos da Pessoa Idosa - exist\u00eancia",
    "MDHU30": "Conselho Municipal de Direitos da Pessoa com Defici\u00eancia - exist\u00eancia",
    "MDHU36": "Conselho Municipal de Direitos de L\u00e9sbicas, Gays, Bissexuais, Travestis e Transexuais - exist\u00eancia",
    "MDHU42": "Conselho Municipal de Igualdade Racial - exist\u00eancia",
    "MDHU48": "Conselho Municipal dos Povos e Comunidades Tradicionais - exist\u00eancia",
    "MTIC252": "Utiliza grupos de discuss\u00f5es, foruns ou comunidades",
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
    "3103",
    "sociocultural",
    "participacao_publica",
    "Somatoria(MDHU12*1 + MDHU18*1 + MDHU24*1 + MDHU30*1 + MDHU36*1 + MDHU42*1 + MDHU48*1 + MTIC252*3)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
