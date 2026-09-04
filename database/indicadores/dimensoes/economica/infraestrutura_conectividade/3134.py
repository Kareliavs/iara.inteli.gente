from indicadores.core import IndicatorSpec, Variables, to_number


TEXTOS_VARIAVEIS = {
    "MNADT": "Acesso discado/conex\u00e3o discada via telefone",
    "MNCFO": "Via cabo ou fibra \u00f3tica",
    "MNDSL": "Via linha telef\u00f4nica DSL",
    "MNDSLG": "Via modem/via linha telef\u00f4nica DSLG ou via r\u00e1dio G",
    "MNRD": "Via r\u00e1dio",
    "MNSAT": "Via sat\u00e9lite",
    "MNNS": "N\u00e3o sabe informar",
    "MNND": "N\u00e3o existe informa\u00e7\u00e3o disposn\u00edvel",
    "MNNPN": "N\u00e3o possui a\u00e7\u00f5es",
    "MNREC": "Se recusou a informar",
}


def _calc(variaveis: Variables):
    usadas = {
        sigla: to_number(variaveis.get(sigla, 0), default=0.0)
        for sigla in TEXTOS_VARIAVEIS
    }

    # A formula usa operador OU; aqui usamos o maior escore ponderado entre as alternativas.
    valor = max(
        usadas["MNADT"] * 1,
        usadas["MNCFO"] * 3,
        usadas["MNDSL"] * 1,
        usadas["MNDSLG"] * 2,
        usadas["MNRD"] * 1,
        usadas["MNSAT"] * 3,
        usadas["MNNS"] * 0,
        usadas["MNND"] * 0,
        usadas["MNNPN"] * 0,
        usadas["MNREC"] * 0,
    )

    textos_ativos = [
        texto
        for sigla, texto in TEXTOS_VARIAVEIS.items()
        if usadas[sigla] == 1
    ]
    indicador_texto = "; ".join(textos_ativos)

    return valor, usadas, indicador_texto


SPEC = IndicatorSpec(
    "3134",
    "economica",
    "infraestrutura_conectividade",
    "(MNADT*1 OU MNCFO*3 OU MNDSL*1 OU MNDSLG*2 OU MNRD*1 OU MNSAT*3 OU MNNS*0 OU MNND*0 OU MNNPN*0 OU MNREC*0)",
    tuple(TEXTOS_VARIAVEIS.keys()),
    _calc,
)
