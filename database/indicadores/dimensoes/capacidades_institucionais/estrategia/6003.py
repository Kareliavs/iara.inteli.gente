from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "F18PDIR": 2,
    "F18_1PDTIC": 3,
    "F18_3LAI": 1,
    "F18_2LOPPA": 1,
    "F18_5PECI": 3,
    "F18_4NHAPLAN": 0,
}

TEXTOS_VARIAVEIS = {
    "F18_1PDTIC": "Plano diretor de tecnologia da informa\u00e7\u00e3o",
    "F18_2LOPPA": "Leis or\u00e7ament\u00e1rias (PPA, LDO, LOA)",
    "F18_3LAI": "Lei de Acesso \u00e0 Informa\u00e7\u00e3o (LAI)",
    "F18_4NHAPLAN": "N\u00e3o h\u00e1 a\u00e7\u00f5es previstas em instrumentos de planejamento",
    "F18_5PECI": "Plano estrat\u00e9gico para cidades inteligentes",
    "F18PDIR": "Plano diretor",
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
    "6003",
    "capacidades_institucionais",
    "estrategia",
    "Somatoria(F18PDIR*2 + F18_1PDTIC*3 + F18_3LAI*1 + F18_2LOPPA*1 + F18_5PECI*3 + F18_4NHAPLAN*0)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
