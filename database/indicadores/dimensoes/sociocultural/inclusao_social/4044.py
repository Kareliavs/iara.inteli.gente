from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "MASS261": 1,
    "MASS262": 1,
    "MASS263": 1,
    "MASS264": 1,
    "MASS265": 1,
    "MASS266": 1,
    "MASS267": 1,
    "MASS268": 1,
    "MASS269": 1,
    "MASS2615": 0,
    "MASS2610": 1,
    "MASS2611": 1,
    "MASS2612": 1,
    "MASS2613": 1,
    "MASS2614": 1,
}

TEXTOS_VARIAVEIS = {
    "MASS261": "Povos ind\u00edgenas",
    "MASS262": "Povos ciganos",
    "MASS263": "Comunidades quilombolas",
    "MASS264": "Ribeirinhos",
    "MASS265": "Povos de matriz africana",
    "MASS266": "Outros povos ou comunidades tradicionais",
    "MASS267": "Popula\u00e7\u00e3o em situa\u00e7\u00e3o de rua",
    "MASS268": "Agricultores familiares",
    "MASS269": "Assentados da reforma agr\u00e1ria",
    "MASS2615": "Nenhum dos citados",
    "MASS2610": "Pescadores artesanais",
    "MASS2611": "Catadores de materiais recicl\u00e1veis",
    "MASS2612": "Migrantes/Imigrantes/Refugiados",
    "MASS2613": "Atingidas por empreendimentos de infraestrutura",
    "MASS2614": "Encarcerado/egressos do sistema carcer\u00e1rio",
}


def _calc(variaveis: Variables):
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
    "4044",
    "sociocultural",
    "inclusao_social",
    "Somatoria(MASS261*1 + MASS262*1 + MASS263*1 + MASS264*1 + MASS265*1 + MASS266*1 + MASS267*1 + MASS268*1 + MASS269*1 + MASS2615*0 + MASS2610*1 + MASS2611*1 + MASS2612*1 + MASS2613*1 + MASS2614*1)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc
)
