from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MTIC12B1": 1,
    "MTIC12B2": 1,
    "MTIC12B3": 1,
    "MTIC12B4": 1,
    "MTIC12B5": 1,
    "MTIC12B6": 1,
    "MTIC12B7": 1,
    "MTIC12B8": 1,
    "MTIC12B9": 1,
    "MTIC12B10": 1,
    "MTIC12B11": 1,
    "MTIC12B12": 1,
}

TEXTOS_VARIAVEIS = {
    "MTIC12B1": "Ouvidoria e servi\u00e7os de atendimento ao cidad\u00e3o",
    "MTIC12B2": "Download de documentos ou formul\u00e1rios",
    "MTIC12B3": "Consulta a processos/acompanhamento de protocolos",
    "MTIC12B4": "Consulta pr\u00e9via",
    "MTIC12B5": "Cadastramento de fornecedores",
    "MTIC12B6": "Emiss\u00e3o de certid\u00e3o negativa de d\u00e9bito",
    "MTIC12B7": "Emiss\u00e3o de alvar\u00e1",
    "MTIC12B8": "Emiss\u00e3o de Nota Fiscal Eletr\u00f4nica",
    "MTIC12B9": "Matr\u00edcula escolar na rede p\u00fablica online",
    "MTIC12B10": "Agendamento de consulta e exame na rede p\u00fablica de sa\u00fade",
    "MTIC12B11": "Emiss\u00e3o de guia de pagamento de tributos",
    "MTIC12B12": "Emiss\u00e3o de documentos como licen\u00e7as, certid\u00f5es, permiss\u00f5es e outros documentos",
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
    "6056",
    "capacidades_institucionais",
    "servicos_aplicacoes",
    "Somatoria(MTIC12B1*1+MTIC12B2*1+MTIC12B3*1+MTIC12B4*1+MTIC12B5*1+MTIC12B6*1+MTIC12B7*1+MTIC12B8*1+MTIC12B9*1+MTIC12B10*1+MTIC12B11*1+MTIC12B12*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
