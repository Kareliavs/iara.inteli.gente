from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MCUL15": 3,
    "MCUL161": 1,
    "MCUL162": 1,
    "MCUL19": 2,
}

TEXTOS_VARIAVEIS = {
    "MCUL15": "Legisla\u00e7\u00e3o municipal de prote\u00e7\u00e3o ao patrim\u00f4nio cultural - exist\u00eancia",
    "MCUL161": "Patrim\u00f4nio material",
    "MCUL162": "Patrim\u00f4nio imaterial",
    "MCUL19": "Conselho municipal de cultura - exist\u00eancia",
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
    "3107",
    "sociocultural",
    "cultura",
    "Somatoria (MCUL15*3+MCUL161*1+MCUL162*1+MCUL19*2)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
