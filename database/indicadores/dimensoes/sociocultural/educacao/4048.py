from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, ensure_pop, required, to_number



def _calc(variaveis: Variables):
    required(variaveis, ("QT_DESKTOP_ALUNO", "QT_COMP_PORTATIL_ALUNO", "QT_MATRÍCULAS"))
    qtd_desktop = to_number(variaveis["QT_DESKTOP_ALUNO"])
    qtd_portatil = to_number(variaveis["QT_COMP_PORTATIL_ALUNO"])
    qtd_matriculas = to_number(variaveis["QT_MATRÍCULAS"])
    ensure_pop(qtd_matriculas)
    valor = ((qtd_desktop + qtd_portatil) / qtd_matriculas) * 100000
    return valor, {
        "QT_DESKTOP_ALUNO": qtd_desktop,
        "QT_COMP_PORTATIL_ALUNO": qtd_portatil,
        "QT_MATRÍCULAS": qtd_matriculas,
    }


SPEC = IndicatorSpec(
    "4048",
    "sociocultural",
    "educacao",
    "((QT_DESKTOP_ALUNO + QT_COMP_PORTATIL_ALUNO)/QT_MATRÍCULAS)*100000",
    ("QT_DESKTOP_ALUNO", "QT_COMP_PORTATIL_ALUNO", "QT_MATRÍCULAS"),
    _calc
)
