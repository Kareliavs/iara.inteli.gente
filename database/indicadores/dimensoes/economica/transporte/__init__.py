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
_spec_3076 = _load_spec("3076")
INDICATOR_SPECS[_spec_3076.indicator_id] = _spec_3076
_spec_3124 = _load_spec("3124")
INDICATOR_SPECS[_spec_3124.indicator_id] = _spec_3124
_spec_4011 = _load_spec("4011")
INDICATOR_SPECS[_spec_4011.indicator_id] = _spec_4011
_spec_4012 = _load_spec("4012")
INDICATOR_SPECS[_spec_4012.indicator_id] = _spec_4012
_spec_4031 = _load_spec("4031")
INDICATOR_SPECS[_spec_4031.indicator_id] = _spec_4031
_spec_4046 = _load_spec("4046")
INDICATOR_SPECS[_spec_4046.indicator_id] = _spec_4046

_spec_3049 = _load_spec("3049")
INDICATOR_SPECS[_spec_3049.indicator_id] = _spec_3049

__all__ = ["INDICATOR_SPECS"]
