from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MGRD183": 1,
    "MGRD186": 1,
    "MGRD187": 1,
    "MGRD201": 1,
    "MGRD206": 1,
    "MGRD212": 1,
    "MGRD2213": 1,
}

TEXTOS_VARIAVEIS = {
    "MGRD183": "Mecanismos de controle e fiscaliza\u00e7\u00e3o para evitar ocupa\u00e7\u00e3o em \u00e1reas suscet\u00edveis aos desastres",
    "MGRD186": "Sistema de alerta antecipado de desastre decorrente de enchentes, inunda\u00e7\u00f5es ou enxurradas",
    "MGRD187": "Cadastro de risco",
    "MGRD201": "Mapeamentos de \u00e1reas de risco de enchentes ou inunda\u00e7\u00f5es",
    "MGRD206": "Sistema de alerta antecipado de desastre decorrente de escorregamento ou deslizamento de encosta",
    "MGRD212": "Coordena\u00e7\u00e3o municipal de prote\u00e7\u00e3o e defesa civil",
    "MGRD2213": "Sistema de alerta antecipado de desastres de defesa civil",
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
    "3007",
    "sociocultural",
    "gestao_desastres",
    "Somatoria(MGRD183*1 + MGRD186*1 + MGRD187*1 + MGRD201*1 + MGRD206*1 + MGRD212*1 + MGRD2213*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
