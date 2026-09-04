from indicadores.core import IndicatorSpec, Variables, to_number


TEXTOS_VARIAVEIS = {
    "F23_1PESSTECTI": "Existe pessoal t\u00e9cnico qualificado, em alguma \u00e1rea da prefeitura, para elaborar planos de TI",
    "F23_2DEPTOINFRATIC": "Existe departamento, setor ou \u00e1rea respons\u00e1vel pela infraestrutura de TI no munic\u00edpio",
    "F23_3NERESPIFRA": "N\u00e3o Existe respons\u00e1vel pela infraestrutura de TI",
    "F23ARTPLANTI": "Existe pelo menos uma pessoa articulando para a elabora\u00e7\u00e3o de planos de TI",
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
    "6017",
    "caracterizacao_institucional",
    "institucional",
    "Textos correspondentes \u00e0s vari\u00e1veis bin\u00e1rias ativas entre F23_1PESSTECTI, F23_2DEPTOINFRATIC, F23_3NERESPIFRA e F23ARTPLANTI",
    tuple(TEXTOS_VARIAVEIS.keys()),
    _calc,
)
