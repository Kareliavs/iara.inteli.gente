from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MTIC011": 1,
    "MTIC012": 1,
    "MTIC013": 1,
    "MTIC014": 1,
    "MTIC015": 1,
    "MTIC131": 1,
    "MTIC132": 1,
    "MTIC133": 1,
    "MTIC137": 1,
    "MTIC161": 1,
    "MTIC163": 1,
    "MTIC165": 1,
}

TEXTOS_VARIAVEIS = {
    "MTIC011": "Correio",
    "MTIC012": "Jornal",
    "MTIC013": "Website",
    "MTIC014": "WhatsApp",
    "MTIC015": "Telefone",
    "MTIC131": "Facebook",
    "MTIC132": "Instagram",
    "MTIC133": "Youtube",
    "MTIC137": "Twitter",
    "MTIC161": "Envio de sms para o cidad\u00e3o",
    "MTIC163": "Aplicativos criados pela prefeitura ou outros organismos",
    "MTIC165": "Website adaptado para dispositivos m\u00f3veis ou desenhado em vers\u00e3o mobile",
}


def _calc(variaveis: Variables):
    if not any(sigla in variaveis for sigla in PESOS_VARIAVEIS):
        raise ValueError("Nenhuma variavel do indicador 4066 encontrada no ano")

    usadas = {
        sigla: to_number(variaveis.get(sigla, 0), default=0.0)
        for sigla in PESOS_VARIAVEIS
    }

    valor = sum(usadas.values())
    textos_ativos = [
        texto
        for sigla, texto in TEXTOS_VARIAVEIS.items()
        if usadas[sigla] == 1
    ]

    return valor, usadas, "; ".join(textos_ativos)


SPEC = IndicatorSpec(
    "4066",
    "economica",
    "servicos_online_prefeitura",
    "Somatoria(MTIC011*1 + MTIC012*1 + MTIC013*1 + MTIC014*1 + MTIC015*1 + MTIC131*1 + MTIC132*1 + MTIC133*1 + MTIC137*1 + MTIC161*1 + MTIC163*1 + MTIC165*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
