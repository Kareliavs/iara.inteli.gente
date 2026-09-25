from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, required, to_number



RECURSOS_SIGLAS = (
    "IN_COMP_PORTATIL_ALUNO",
    "IN_DESKTOP_ALUNO",
    "IN_EQUIP_LOUSA_DIGITAL",
    "IN_EQUIP_MULTIMIDIA",
    "IN_INTERNET_APRENDIZAGEM_ALUNOS",
    "IN_LABORATORIO_INFORMATICA",
    "IN_TABLET_ALUNO",
)
SIGLAS = (*RECURSOS_SIGLAS, "ESC_MUN")


def _calc(variaveis: Variables):
    required(variaveis, SIGLAS)

    usadas: Variables = {}
    soma = 0.0

    for sigla in RECURSOS_SIGLAS:
        valor = to_number(variaveis[sigla])
        usadas[sigla] = valor
        soma += valor

    total_escolas = to_number(variaveis["ESC_MUN"])
    if total_escolas <= 0:
        raise ValueError("ESC_MUN deve ser maior que zero")
    usadas["ESC_MUN"] = total_escolas

    return (soma / (len(RECURSOS_SIGLAS) * total_escolas)) * 100.0, usadas


SPEC = IndicatorSpec(
    "3003",
    "sociocultural",
    "educacao",
    "(Somatoria(IN_COMP_PORTATIL_ALUNO + IN_DESKTOP_ALUNO + IN_EQUIP_LOUSA_DIGITAL + IN_EQUIP_MULTIMIDIA + IN_INTERNET_APRENDIZAGEM_ALUNOS + IN_LABORATORIO_INFORMATICA + IN_TABLET_ALUNO)/(7*ESC_MUN))*100",
    SIGLAS,
    _calc
)
