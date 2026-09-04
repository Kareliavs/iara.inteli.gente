from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number

PESOS_VARIAVEIS = {
    "F6PTS": 2,
    "F6_1PM10": 2,
    "F6_2PM25": 2,
    "F6_10CH4": 1,
    "F6_11O3": 1,
    "F6_3CO": 1,
    "F6_4SO2": 1,
    "F6_5NOx": 1,
    "F6_6NO": 1,
    "F6_7NO2": 1,
    "F6_8HCT": 1,
    "F6_9HCnM": 1,
}

TEXTOS_VARIAVEIS = {
    "F6_10CH4": "Medi\u00e7\u00e3o de Metano (CH4)",
    "F6_11O3": "Medi\u00e7\u00e3o de Oz\u00f4nio (O3)",
    "F6_1PM10": "Medir Part\u00edculas Inal\u00e1veis < 10 \u00b5m (PM10)",
    "F6_2PM25": "Para medir Part\u00edculas Inal\u00e1veis < 2,5 \u00b5m (PM2,5)",
    "F6_3CO": "Medir Mon\u00f3xido de Carbono (CO)",
    "F6_4SO2": "Medir Di\u00f3xido de Enxofre (SO2)",
    "F6_5NOx": "Medir \u00d3xidos de Nitrog\u00eanio (NOx)",
    "F6_6NO": "Medi\u00e7\u00e3o de Mon\u00f3xido de Nitrog\u00eanio (NO)",
    "F6_7NO2": "Medi\u00e7\u00e3o de Di\u00f3xido de Nitrog\u00eanio (NO2)",
    "F6_8HCT": "Medi\u00e7\u00e3o de Hidrocarbonetos Totais (HCT)",
    "F6_9HCnM": "Medi\u00e7\u00e3o de Hidrocarbonetos, exceto Metano (HCnM)",
    "F6PTS": "Medir Part\u00edculas Totais em Suspens\u00e3o (PTS)",
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
    "3056",
    "meio_ambiente",
    "qualidade_ar",
    "Somatoria(F6PTS*2 + F6_1PM10*2 + F6_2PM25*2 + F6_10CH4*1 + F6_11O3*1 + F6_3CO*1 + F6_4SO2*1 + F6_5NOx*1 + F6_6NO*1 + F6_7NO2*1 + F6_8HCT*1 + F6_9HCnM*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
