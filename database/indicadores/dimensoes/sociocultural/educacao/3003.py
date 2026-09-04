from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number



SIGLAS = (
    "IN_COMP_PORTATIL_ALUNO",
    "IN_DESKTOP_ALUNO",
    "IN_EQUIP_LOUSA_DIGITAL",
    "IN_EQUIP_MULTIMIDIA",
    "IN_INTERNET_APRENDIZAGEM_ALUNOS",
    "IN_LABORATORIO_INFORMATICA",
    "IN_TABLET_ALUNO",
)


def _calc(variaveis: Variables):
    usadas: Variables = {}
    soma = 0.0

    for sigla in SIGLAS:
        valor = to_number(variaveis.get(sigla, 0.0), default=0.0)
        usadas[sigla] = valor
        soma += valor

    return (soma / 7.0) * 100.0, usadas


SPEC = IndicatorSpec(
    "3003",
    "sociocultural",
    "educacao",
    "(Somatoria(IN_COMP_PORTATIL_ALUNO + IN_DESKTOP_ALUNO + IN_EQUIP_LOUSA_DIGITAL + IN_EQUIP_MULTIMIDIA + IN_INTERNET_APRENDIZAGEM_ALUNOS + IN_LABORATORIO_INFORMATICA + IN_TABLET_ALUNO)/7)*100",
    SIGLAS,
    _calc
)
