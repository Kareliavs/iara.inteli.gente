from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "F16_1INFATVCULT": 1,
    "F16_2INFCULT": 1,
    "F16_3PUBLESTCULT": 1,
    "F16_4CATBIBL": 1,
    "F16_5TRAMVIDSTR": 1,
    "F16_6VVIRT": 1,
    "F16_7ACSSDIG": 1,
    "F16PATVCUL": 1,
}

TEXTOS_VARIAVEIS = {
    "F16_1INFATVCULT": "Oferece informa\u00e7\u00f5es sobre as atividades culturais",
    "F16_2INFCULT": "Oferece divulga\u00e7\u00e3o de not\u00edcias sobre cultura",
    "F16_3PUBLESTCULT": "Oferece publica\u00e7\u00f5es e estudos",
    "F16_4CATBIBL": "Oferece cat\u00e1logos de acervos (biblioteca)",
    "F16_5TRAMVIDSTR": "Disponibiliza ferramenta de transmiss\u00e3o de v\u00eddeos ao vivo/streaming",
    "F16_6VVIRT": "Disponibiliza visita virtual aos equipamentos e acervos culturais",
    "F16_7ACSSDIG": "Disponibiliza recurso de acessibilidade digital",
    "F16PATVCUL": "Oferece programa\u00e7\u00e3o das atividades culturais",
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
    "4040",
    "sociocultural",
    "cultura",
    "Somatoria(F16_1INFATVCULT*1 + F16_2INFCULT*1 + F16_3PUBLESTCULT*1 + F16_4CATBIBL*1 + F16_5TRAMVIDSTR*1 + F16_6VVIRT*1 + F16_7ACSSDIG*1 + F16PATVCUL)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
