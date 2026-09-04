from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "F20_10FINPRIV": 1,
    "F20_11ORGINT": 1,
    "F20_12CONSPRIV": 1,
    "F20_1GEST": 1,
    "F20_2GFED": 1,
    "F20_3SPRIV": 1,
    "F20_4SCORG": 1,
    "F20_5CIDMUNIC": 1,
    "F20_6UIPESQ": 1,
    "F20_7CVER": 1,
    "F20_8ESSILOC": 1,
    "F20_9AGFOMPUBL": 1,
    "F20GMUN": 1,
    "F20_13NENA": 0,
}

TEXTOS_VARIAVEIS = {
    "F20_10FINPRIV": "Financiadores privados",
    "F20_11ORGINT": "Organismos internacionais",
    "F20_12CONSPRIV": "Consultoria privada contratada",
    "F20_13NENA": "N\u00e3o existe, n\u00e3o dispon\u00edvel",
    "F20_1GEST": "Governo Estadual",
    "F20_2GFED": "Governo Federal",
    "F20_3SPRIV": "Setor privado",
    "F20_4SCORG": "Sociedade civil organizada",
    "F20_5CIDMUNIC": "Cidad\u00e3os",
    "F20_6UIPESQ": "Universidades e institutos de pesquisa",
    "F20_7CVER": "C\u00e2mara dos vereadores",
    "F20_8ESSILOC": "Ecossistema de inova\u00e7\u00e3o local",
    "F20_9AGFOMPUBL": "Ag\u00eancias de fomento p\u00fablica",
    "F20GMUN": "Governo municipal",
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
    "6006",
    "capacidades_institucionais",
    "estrategia",
    "Somatoria(F20_10FINPRIV*1 + F20_11ORGINT*1 + F20_12CONSPRIV*1 + F20_1GEST*1 + F20_2GFED*1 + F20_3SPRIV*1 + F20_4SCORG*1 + F20_5CIDMUNIC*1 + F20_6UIPESQ*1 + F20_7CVER*1 + F20_8ESSILOC*1 + F20_9AGFOMPUBL*1 + F20GMUN*1 + F20_13NENA*0)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
