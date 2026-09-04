from indicadores.core import IndicatorSpec, Variables, to_number



def _calc(variaveis: Variables):
    v_f7ippm = to_number(variaveis.get("F7IPPM", 0), default=0.0)
    v_f7_1iptc = to_number(variaveis.get("F7_1IPTC", 0), default=0.0)

    # A formula usa operador OU; aqui usamos o maior escore ponderado entre as alternativas.
    valor = max(
        v_f7ippm * 1,
        v_f7_1iptc * 2,
    )

    usadas = {
        "F7IPPM": v_f7ippm,
        "F7_1IPTC": v_f7_1iptc,
    }
    textos_ativos = [
        texto
        for sigla, texto in {
            "F7_1IPTC": "Possui ilumina\u00e7\u00e3o p\u00fablica por telegest\u00e3o e atende toda a cidade",
            "F7IPPM": "Possui ilumina\u00e7\u00e3o p\u00fablica por telegest\u00e3o e atende parte da cidade",
        }.items()
        if usadas.get(sigla, 0) == 1
    ]
    texto = "; ".join(textos_ativos) if textos_ativos else "Sem resposta do formul\u00e1rio"

    return valor, usadas, texto


SPEC = IndicatorSpec(
    "3069",
    "meio_ambiente",
    "energia",
    "(F7IPPM*1 OU F7_1IPTC*2)",
    ("F7IPPM", "F7_1IPTC"),
    _calc
)
