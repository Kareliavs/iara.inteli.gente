from indicadores.core import IndicatorSpec, Variables, to_number


TEXTOS_VARIAVEIS = {
    "F22_1CONSCIND": "Conselho da cidade",
    "F22_2COMESP": "Comit\u00ea espec\u00edfico constitu\u00eddo",
    "F22_3CONSPRIVTERC": "Consultoria privada e/ou terceirizada",
    "F22_4NRESP": "N\u00e3o h\u00e1 respons\u00e1vel",
    "F22DEPTGMUN": "Secretaria ou Departamento da gest\u00e3o municipal",
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
    "6011",
    "caracterizacao_institucional",
    "institucional",
    "Textos correspondentes \u00e0s vari\u00e1veis bin\u00e1rias ativas entre F22_1CONSCIND, F22_2COMESP, F22_3CONSPRIVTERC, F22_4NRESP e F22DEPTGMUN",
    tuple(TEXTOS_VARIAVEIS.keys()),
    _calc,
)
