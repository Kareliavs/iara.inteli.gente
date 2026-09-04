from indicadores.core import IndicatorSpec, Variables, to_number


TEXTOS_VARIAVEIS = {
    "MTIC06": "Existência de estrutura organizacional para TIC no municipio",
    "MTIC071": "Funcionários efetivos",
    "MTIC072": "Servidores Cedidos",
    "MTIC074": "Comissionados",
    "MTIC075": "Terceirizados",
    "MTIC076": "Consultores",
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

    indicador = ", ".join(textos_ativos)
    return indicador, usadas


SPEC = IndicatorSpec(
    "6020",
    "caracterizacao_institucional",
    "institucional",
    "Textos correspondentes às variáveis binárias ativas entre MTIC06, MTIC071, MTIC072, MTIC074, MTIC075 e MTIC076",
    tuple(TEXTOS_VARIAVEIS.keys()),
    _calc,
)
