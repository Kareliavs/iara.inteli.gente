from __future__ import annotations

from indicadores.core import IndicatorSpec, Variables, to_number


PESOS_VARIAVEIS = {
    "F27_1CERTDIGFPAGTO": 1,
    "F27_2SUPORENESERVCENTR": 1,
    "F27_3BACKUP": 1,
    "F27_4INDINVSPAM": 1,
    "F27_5CONTRSWINST": 1,
    "F27_6SAREDE": 1,
    "F27_7RESTRACFIS": 1,
    "F27AELETRDIGDOC": 1,
    "F27_8NPRAST": 0,
}

TEXTOS_VARIAVEIS = {
    "F27_1CERTDIGFPAGTO": "Certificados digitais para transa\u00e7\u00f5es ou pagamentos",
    "F27_2SUPORENESERVCENTR": "Suprimento de energia aos servidores centrais",
    "F27_3BACKUP": "Backup",
    "F27_4INDINVSPAM": "Programas para identifica\u00e7\u00e3o de invas\u00f5es, v\u00edrus e spam",
    "F27_5CONTRSWINST": "Controle dos softwares instalados nas esta\u00e7\u00f5es de trabalho dos usu\u00e1rios",
    "F27_6SAREDE": "Senha para acesso \u00e0 rede e aplica\u00e7\u00f5es",
    "F27_7RESTRACFIS": "Restri\u00e7\u00e3o de acesso f\u00edsico aos servidores centrais",
    "F27_8NPRAST": "Nenhuma pr\u00e1tica",
    "F27AELETRDIGDOC": "Assinatura eletr\u00f4nica ou digital em documentos",
}


def _calc(variaveis: Variables):
    usadas = {
        sigla: to_number(variaveis.get(sigla, 0), default=0.0)
        for sigla in PESOS_VARIAVEIS
    }
    valor = sum(usadas[sigla] * peso for sigla, peso in PESOS_VARIAVEIS.items())
    textos_ativos = [
        texto for sigla, texto in TEXTOS_VARIAVEIS.items() if usadas.get(sigla, 0) == 1
    ]
    texto = "; ".join(textos_ativos) if textos_ativos else "Sem resposta do formul\u00e1rio"
    return valor, usadas, texto


SPEC = IndicatorSpec(
    "6035",
    "capacidades_institucionais",
    "dados_abertos",
    "Somatoria(F27_1CERTDIGFPAGTO*1 + F27_2SUPORENESERVCENTR*1 + F27_3BACKUP*1 + F27_4INDINVSPAM*1 + F27_5CONTRSWINST*1 + F27_6SAREDE*1 + F27_7RESTRACFIS*1 + F27AELETRDIGDOC*1 + F27_8NPRAST*0)",
    tuple(PESOS_VARIAVEIS.keys()),
    _calc,
)
