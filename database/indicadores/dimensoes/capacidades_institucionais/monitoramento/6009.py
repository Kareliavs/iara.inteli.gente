from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "F21_1PRODIGDISP": 1,
    "F21_2PLANDISPINDIMP": 1,
    "F21_3AVRESUKPROCPLAMET": 1,
    "F21PROCFORMPLAMET": 1,
    "F21_4NACINTIC": 0,
}

TEXTOS_VARIAVEIS = {
    "F21_1PRODIGDISP": "Por meio de processos digitalizados dispon\u00edveis",
    "F21_2PLANDISPINDIMP": "Com dados de planejamento dispon\u00edveis e indicadores de implementa\u00e7\u00e3o",
    "F21_3AVRESUKPROCPLAMET": "H\u00e1 uma avalia\u00e7\u00e3o dos resultados do processo de formula\u00e7\u00e3o dos planos e/ou metas",
    "F21_4NACINTIC": "N\u00e3o h\u00e1 acompanhamento de incorpora\u00e7\u00e3o de TICs - pontua\u00e7\u00e3o igual a zero",
    "F21PROCFORMPLAMET": "Por meio de processo de formula\u00e7\u00e3o dos planos e/ou metas",
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
    "6009",
    "capacidades_institucionais",
    "monitoramento",
    "Somatoria(F21_1PRODIGDISP*1 + F21_2PLANDISPINDIMP*1 + F21_3AVRESUKPROCPLAMET*1 + F21PROCFORMPLAMET*1 + F21_4NACINTIC*0)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
