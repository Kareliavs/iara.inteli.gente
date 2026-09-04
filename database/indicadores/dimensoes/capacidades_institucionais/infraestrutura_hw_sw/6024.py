from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "F26DCPROP": 3,
    "F26_1NUV": 3,
    "F26_2SERVPROP": 3,
    "F26_3COMPCONCREDE": 2,
    "F26_4COMPNCONECTREDE": 1,
    "F26_5COMPPESS": 1,
    "F26_6ARQFISICO": 1,
    "F26_7NARMDADO": 0,
}

TEXTOS_VARIAVEIS = {
    "F26_1NUV": "Nuvem (pr\u00f3pria/terceirizada/hibrida)",
    "F26_2SERVPROP": "Servidor pr\u00f3prio",
    "F26_3COMPCONCREDE": "Armazenados em computadores da prefeitura conectados em rede",
    "F26_4COMPNCONECTREDE": "Armazenados em computadores da prefeitura n\u00e3o-conectados em rede",
    "F26_5COMPPESS": "Armazenados em computadores pessoais",
    "F26_6ARQFISICO": "Dados est\u00e3o em arquivo f\u00edsico em papel",
    "F26_7NARMDADO": "N\u00e3o existem sistemas de armazenagem de dados",
    "F26DCPROP": "Data center pr\u00f3prio",
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
    "6024",
    "capacidades_institucionais",
    "infraestrutura_hw_sw",
    "Somatoria(F26DCPROP*3 + F26_1NUV*3 + F26_2SERVPROP*3 + F26_3COMPCONCREDE*2 + F26_4COMPNCONECTREDE*1 + F26_5COMPPESS*1 + F26_6ARQFISICO*1 + F26_7NARMDADO*0)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
