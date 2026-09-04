from indicadores.core import IndicatorSpec, Variables, to_number


TEXTOS_VARIAVEIS = {
    "F17_10TRANSP": "Transporte",
    "F17_11TUR": "Turismo",
    "F17_12NPNT": "N\u00e3o Tem, n\u00e3o possue",
    "F17_1CULT": "Cultura",
    "F17_2DEINOV": "Desenvolvimento e Inova\u00e7\u00e3o",
    "F17_3EDU": "Educa\u00e7\u00e3o",
    "F17_4GEST": "Gest\u00e3o",
    "F17_5MA": "Meio Ambiente",
    "F17_6OIFRA": "Obras Infraestrutura",
    "F17_7PURB": "Planejamento Urbano",
    "F17_8SAUD": "Sa\u00fade",
    "F17_9SEG": "Seguran\u00e7a",
    "F17ASSSOC": "Assist\u00eancia Social",
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
    "6002",
    "caracterizacao_institucional",
    "institucional",
    "Textos correspondentes \u00e0s vari\u00e1veis bin\u00e1rias ativas entre F17_10TRANSP, F17_11TUR, F17_12NPNT, F17_1CULT, F17_2DEINOV, F17_3EDU, F17_4GEST, F17_5MA, F17_6OIFRA, F17_7PURB, F17_8SAUD, F17_9SEG e F17ASSSOC",
    tuple(TEXTOS_VARIAVEIS.keys()),
    _calc,
)
