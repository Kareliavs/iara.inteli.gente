from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "F25_1PRATPADRTIPREF": 1,
    "F25_2PROCFORMCONTTI": 1,
    "F25_3ACESPFORNEXT": 1,
    "F25_4APRIMTIPSERV": 1,
    "F25EPRTIPREF": 1,
    "F25_5NADPRSTPREF": 0,
}

TEXTOS_VARIAVEIS = {
    "F25_1PRATPADRTIPREF": "As pr\u00e1ticas comuns s\u00e3o padronizadas em rela\u00e7\u00e3o ao uso da TI nas \u00e1reas da prefeitura",
    "F25_2PROCFORMCONTTI": "Os processos s\u00e3o formalizados para contrata\u00e7\u00e3o e gest\u00e3o de servi\u00e7os de TI",
    "F25_3ACESPFORNEXT": "H\u00e1 acordos de n\u00edvel de servi\u00e7o com usu\u00e1rios internos e com fornecedores externos",
    "F25_4APRIMTIPSERV": "A \u00e1rea de TI aprimora continuamente seus processos de gest\u00e3o, desenvolvimento e padroniza\u00e7\u00e3o e busca atualizar a tecnologia e incorpor\u00e1-las a seus servi\u00e7os",
    "F25_5NADPRSTPREF": "N\u00e3o adota nenhuma pr\u00e1tica",
    "F25EPRTIPREF": "Existem pr\u00e1ticas comuns em rela\u00e7\u00e3o ao uso da TI nas \u00e1reas da prefeitura",
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
    "6021",
    "capacidades_institucionais",
    "infraestrutura_hw_sw",
    "Somatoria(F25_1PRATPADRTIPREF*1 + F25_2PROCFORMCONTTI*1 + F25_3ACESPFORNEXT*1 + F25_4APRIMTIPSERV*1 + F25EPRTIPREF*1 + F25_5NADPRSTPREF*0)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
