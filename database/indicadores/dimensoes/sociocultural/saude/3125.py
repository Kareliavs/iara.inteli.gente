from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "F11PPPPS": 1,
    "F11_1PEPS": 2,
}

TEXTOS_VARIAVEIS = {
    "F11_1PEPS": "Disponibiliza em todos os estabelecimentos de sa\u00fade",
    "F11PPPPS": "Disponibiliza em parte dos estabelecimentos de sa\u00fade",
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
    texto = "; ".join(textos_ativos) if textos_ativos else "Sem resposta do formul\u00e1rio"
    return valor, usadas, texto


SPEC = IndicatorSpec(
    "3125",
    "sociocultural",
    "saude",
    "Somatoria(F11PPPPS*1 + F11_1PEPS*2)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
