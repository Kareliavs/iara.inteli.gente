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
_spec_3007 = _load_spec("3007")
INDICATOR_SPECS[_spec_3007.indicator_id] = _spec_3007
_spec_4042 = _load_spec("4042")
INDICATOR_SPECS[_spec_4042.indicator_id] = _spec_4042
_spec_4068 = _load_spec("4068")
INDICATOR_SPECS[_spec_4068.indicator_id] = _spec_4068
_spec_4069 = _load_spec("4069")
INDICATOR_SPECS[_spec_4069.indicator_id] = _spec_4069

__all__ = ["INDICATOR_SPECS"]
