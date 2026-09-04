from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MEDU131": 1,
    "MEDU132": 1,
    "MEDU133": 1,
    "MEDU134": 1,
    "MEDU135": 0,
}

TEXTOS_VARIAVEIS = {
    "MEDU131": "Projetos voltados para a educa\u00e7\u00e3o do campo",
    "MEDU132": "Projetos voltados para educa\u00e7\u00e3o de povos ind\u00edgenas",
    "MEDU133": "Projetos voltados para educa\u00e7\u00e3o quilombolas",
    "MEDU134": "Projetos voltados para a educa\u00e7\u00e3o de outros povos e comunidades tradicionais",
    "MEDU135": "Nenhum dos itens citados",
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
    "4020",
    "sociocultural",
    "educacao",
    "Somatoria (MEDU131*1+MEDU132*1+MEDU133*1+MEDU134*1+MEDU135*0)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
