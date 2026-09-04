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
_spec_3077 = _load_spec("3077")
INDICATOR_SPECS[_spec_3077.indicator_id] = _spec_3077
_spec_3107 = _load_spec("3107")
INDICATOR_SPECS[_spec_3107.indicator_id] = _spec_3107
_spec_3123 = _load_spec("3123")
INDICATOR_SPECS[_spec_3123.indicator_id] = _spec_3123
_spec_4040 = _load_spec("4040")
INDICATOR_SPECS[_spec_4040.indicator_id] = _spec_4040

__all__ = ["INDICATOR_SPECS"]
