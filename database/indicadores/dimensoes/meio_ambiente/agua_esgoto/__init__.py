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
_spec_3024 = _load_spec("3024")
INDICATOR_SPECS[_spec_3024.indicator_id] = _spec_3024
_spec_3028 = _load_spec("3028")
INDICATOR_SPECS[_spec_3028.indicator_id] = _spec_3028
_spec_3042 = _load_spec("3042")
INDICATOR_SPECS[_spec_3042.indicator_id] = _spec_3042
_spec_3110 = _load_spec("3110")
INDICATOR_SPECS[_spec_3110.indicator_id] = _spec_3110
_spec_3128 = _load_spec("3128")
INDICATOR_SPECS[_spec_3128.indicator_id] = _spec_3128
_spec_4047 = _load_spec("4047")
INDICATOR_SPECS[_spec_4047.indicator_id] = _spec_4047
_spec_4071 = _load_spec("4071")
INDICATOR_SPECS[_spec_4071.indicator_id] = _spec_4071

__all__ = ["INDICATOR_SPECS"]
