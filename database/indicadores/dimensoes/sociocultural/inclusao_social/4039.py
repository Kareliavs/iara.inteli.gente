from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MTIC214": 1,
    "MTIC19": 1,
    "MTIC211": 1,
}

TEXTOS_VARIAVEIS = {
    "MTIC214": "Cursos de capacita\u00e7\u00e3o",
    "MTIC19": "Desenvolve programa ou a\u00e7\u00e3o de inclus\u00e3o digital",
    "MTIC211": "Disponibiliza para acesso p\u00fablico",
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
    "4039",
    "sociocultural",
    "inclusao_social",
    "Somatoria(MTIC214*1 + MTIC19*1 + MTIC211*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
