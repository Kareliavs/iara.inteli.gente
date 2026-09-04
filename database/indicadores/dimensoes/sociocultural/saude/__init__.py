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
_spec_3006 = _load_spec("3006")
INDICATOR_SPECS[_spec_3006.indicator_id] = _spec_3006
_spec_3095 = _load_spec("3095")
INDICATOR_SPECS[_spec_3095.indicator_id] = _spec_3095
_spec_3096 = _load_spec("3096")
INDICATOR_SPECS[_spec_3096.indicator_id] = _spec_3096
_spec_3125 = _load_spec("3125")
INDICATOR_SPECS[_spec_3125.indicator_id] = _spec_3125
_spec_4004 = _load_spec("4004")
INDICATOR_SPECS[_spec_4004.indicator_id] = _spec_4004
_spec_4021 = _load_spec("4021")
INDICATOR_SPECS[_spec_4021.indicator_id] = _spec_4021
_spec_4049 = _load_spec("4049")
INDICATOR_SPECS[_spec_4049.indicator_id] = _spec_4049
_spec_4067 = _load_spec("4067")
INDICATOR_SPECS[_spec_4067.indicator_id] = _spec_4067

__all__ = ["INDICATOR_SPECS"]
