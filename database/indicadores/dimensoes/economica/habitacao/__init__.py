from importlib.util import module_from_spec, spec_from_file_location
from pathlib import Path


def _load_spec(module_stem: str):
    module_path = Path(__file__).with_name(f"{module_stem}.py")
    spec = spec_from_file_location(f"{__name__}.{module_stem}", module_path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Nao foi possivel carregar modulo do indicador: {module_stem}")
    module = module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.SPEC


INDICATOR_SPECS = {}
_spec_3020 = _load_spec("3020")
INDICATOR_SPECS[_spec_3020.indicator_id] = _spec_3020
_spec_4041 = _load_spec("4041")
INDICATOR_SPECS[_spec_4041.indicator_id] = _spec_4041
_spec_4045 = _load_spec("4045")
INDICATOR_SPECS[_spec_4045.indicator_id] = _spec_4045

__all__ = ["INDICATOR_SPECS"]
