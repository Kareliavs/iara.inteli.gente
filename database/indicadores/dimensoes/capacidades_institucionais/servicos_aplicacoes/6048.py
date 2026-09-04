from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "F28VERTPREF": 1,
    "F28_1VERTEMSECR": 2,
    "F28_2PERMPRESTSERV": 3,
    "F28_3INTERTRANSVCONJ": 3,
    "F28_4FACSOLCOLGMUN": 3,
    "F28_5NEXINTRSERVSECR": 0,
}

TEXTOS_VARIAVEIS = {
    "F28_1VERTEMSECR": "H\u00e1 sistemas que operam de forma vertical, em uma ou mais secretarias da prefeitura",
    "F28_2PERMPRESTSERV": "H\u00e1 compartilhamento e integra\u00e7\u00e3o de sistemas entre as secretarias da prefeitura, que permitem presta\u00e7\u00e3o de servi\u00e7os em conjunto",
    "F28_3INTERTRANSVCONJ": "H\u00e1 sistemas que operam de forma interoper\u00e1vel e transversal entre secretarias que permitem presta\u00e7\u00e3o de servi\u00e7os em conjunto",
    "F28_4FACSOLCOLGMUN": "H\u00e1 uma plataforma que integra os sistemas e funciona como um facilitador de solu\u00e7\u00f5es colaborativas e participativas entre a gest\u00e3o municipal e mun\u00edcipes",
    "F28_5NEXINTRSERVSECR": "N\u00e3o existe integra\u00e7\u00e3o de servi\u00e7os entre as secretarias",
    "F28VERTPREF": "H\u00e1 sistemas que operam de forma vertical em todas as secretarias da prefeitura",
}


def _calc(variaveis: Variables):
    usadas = {
        sigla: to_number(variaveis.get(sigla, 0), default=0.0)
        for sigla in PESOS_VARIAVEIS
    }
    valor = sum(usadas[sigla] * peso for sigla, peso in PESOS_VARIAVEIS.items())
    textos_ativos = [
        texto for sigla, texto in TEXTOS_VARIAVEIS.items() if usadas.get(sigla, 0) == 1
    ]
    texto = "; ".join(textos_ativos) if textos_ativos else "Sem resposta do formul\u00e1rio"
    return valor, usadas, texto


SPEC = IndicatorSpec(
    "6048",
    "capacidades_institucionais",
    "servicos_aplicacoes",
    "Somatoria(F28VERTPREF*1 + F28_1VERTEMSECR*2 + F28_2PERMPRESTSERV*3 + F28_3INTERTRANSVCONJ*3 + F28_4FACSOLCOLGMUN*3 + F28_5NEXINTRSERVSECR*0)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
