from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MTIC251": 1,
    "MTIC252": 1,
    "MTIC253": 1,
    "MTIC254": 1,
}

TEXTOS_VARIAVEIS = {
    "MTIC251": "Consulta p\u00fablica on line para que cidad\u00e3os possam enviar contribui\u00e7\u00f5es para leis, or\u00e7amentos e planos",
    "MTIC252": "Grupos de discuss\u00e3o como f\u00f3runs ou comunidades pela internet",
    "MTIC253": "Enquete on line sobre assuntos de interesse da prefeitura",
    "MTIC254": "Vota\u00e7\u00e3o on line para orientar a tomada de decis\u00e3o sobre pol\u00edticas p\u00fablicas, or\u00e7amento, etc.",
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
    "3147",
    "sociocultural",
    "participacao_publica",
    "Somatoria(MTIC251*1 + MTIC252*1 + MTIC253*1 + MTIC254*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
