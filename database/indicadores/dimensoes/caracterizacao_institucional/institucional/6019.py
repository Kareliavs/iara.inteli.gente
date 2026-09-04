from indicadores.core import IndicatorSpec, Variables, to_number


TEXTOS_VARIAVEIS = {
    "F24_1AT10FUNC": "De 6 a 10 funcion\u00e1rios",
    "F24_215FUNC": "De 11 a 15 funcion\u00e1rios",
    "F24_3AC16FUNC": "Acima de 16 funcion\u00e1rios",
    "F24_4NTIC": "N\u00e3o existe equipe de TI",
    "F24A5FUNC": "De 1 a 5 funcion\u00e1rios",
}


def _calc(variaveis: Variables):
    usadas = {
        sigla: to_number(variaveis.get(sigla, 0), default=0.0)
        for sigla in TEXTOS_VARIAVEIS
    }
    textos_ativos = [
        texto
        for sigla, texto in TEXTOS_VARIAVEIS.items()
        if usadas[sigla] == 1
    ]
    indicador = "; ".join(textos_ativos) if textos_ativos else "Sem resposta do formul\u00e1rio"
    return indicador, usadas, indicador


SPEC = IndicatorSpec(
    "6019",
    "caracterizacao_institucional",
    "institucional",
    "Textos correspondentes \u00e0s vari\u00e1veis bin\u00e1rias ativas entre F24_1AT10FUNC, F24_215FUNC, F24_3AC16FUNC, F24_4NTIC e F24A5FUNC",
    tuple(TEXTOS_VARIAVEIS.keys()),
    _calc,
)
