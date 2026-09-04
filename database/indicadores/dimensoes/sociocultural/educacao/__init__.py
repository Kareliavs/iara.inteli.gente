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
_spec_3003 = _load_spec("3003")
INDICATOR_SPECS[_spec_3003.indicator_id] = _spec_3003
_spec_3011 = _load_spec("3011")
INDICATOR_SPECS[_spec_3011.indicator_id] = _spec_3011
_spec_3085 = _load_spec("3085")
INDICATOR_SPECS[_spec_3085.indicator_id] = _spec_3085
_spec_3086 = _load_spec("3086")
INDICATOR_SPECS[_spec_3086.indicator_id] = _spec_3086
_spec_3115 = _load_spec("3115")
INDICATOR_SPECS[_spec_3115.indicator_id] = _spec_3115
_spec_4006 = _load_spec("4006")
INDICATOR_SPECS[_spec_4006.indicator_id] = _spec_4006
_spec_4034 = _load_spec("4034")
INDICATOR_SPECS[_spec_4034.indicator_id] = _spec_4034
_spec_4037 = _load_spec("4037")
INDICATOR_SPECS[_spec_4037.indicator_id] = _spec_4037
_spec_4048 = _load_spec("4048")
INDICATOR_SPECS[_spec_4048.indicator_id] = _spec_4048
_spec_4020 = _load_spec("4020")
INDICATOR_SPECS[_spec_4020.indicator_id] = _spec_4020

__all__ = ["INDICATOR_SPECS"]
