from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MTIC211": 1,
    "MTIC212": 1,
    "MTIC213": 1,
    "MTIC214": 1,
    "MTIC215": 1,
    "MTIC216": 1,
}

TEXTOS_VARIAVEIS = {
    "MTIC211": "Disponibiliza\u00e7\u00e3o de acesso p\u00fablico e gratuito \u00e0 Internet atrav\u00e9s de centros de acesso p\u00fablico, como telecentros",
    "MTIC212": "Disponibiliza\u00e7\u00e3o de informa\u00e7\u00f5es e servi\u00e7os de \u00f3rg\u00e3os p\u00fablicos, em quiosque ou balc\u00e3o informatizado",
    "MTIC213": "Estabelecimento de parcerias com doadores de equipamentos e prestadores de servi\u00e7os nas \u00e1reas de inform\u00e1tica e telecomunica\u00e7\u00f5es, a fim de promover o acesso \u00e0 Internet e aos computadores aos indiv\u00edduos",
    "MTIC214": "Promo\u00e7\u00e3o de cursos de capacita\u00e7\u00e3o em inform\u00e1tica para a popula\u00e7\u00e3o",
    "MTIC215": "Instala\u00e7\u00e3o de computadores na rede p\u00fablica municipal de ensino com acesso \u00e0 Internet para utiliza\u00e7\u00e3o de alunos e professores",
    "MTIC216": "Instala\u00e7\u00e3o de rede WI-FI nas escolas da rede p\u00fablica municipal para acesso de professores e alunos",
}


def _calc(variaveis: Variables):
    if not any(sigla in variaveis for sigla in PESOS_VARIAVEIS):
        raise ValueError("Nenhuma variavel do indicador 3039 encontrada no ano")

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
    "3039",
    "sociocultural",
    "inclusao_digital",
    "Somatoria(MTIC211*1 + MTIC212*1 + MTIC213*1 + MTIC214*1 + MTIC215*1 + MTIC216*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
