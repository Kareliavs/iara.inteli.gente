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
_spec_3021 = _load_spec("3021")
INDICATOR_SPECS[_spec_3021.indicator_id] = _spec_3021
_spec_3022 = _load_spec("3022")
INDICATOR_SPECS[_spec_3022.indicator_id] = _spec_3022
_spec_3040 = _load_spec("3040")
INDICATOR_SPECS[_spec_3040.indicator_id] = _spec_3040
_spec_3041 = _load_spec("3041")
INDICATOR_SPECS[_spec_3041.indicator_id] = _spec_3041
_spec_3134 = _load_spec("3134")
INDICATOR_SPECS[_spec_3134.indicator_id] = _spec_3134
_spec_4035 = _load_spec("4035")
INDICATOR_SPECS[_spec_4035.indicator_id] = _spec_4035
_spec_4036 = _load_spec("4036")
INDICATOR_SPECS[_spec_4036.indicator_id] = _spec_4036
_spec_4065 = _load_spec("4065")
INDICATOR_SPECS[_spec_4065.indicator_id] = _spec_4065

__all__ = ["INDICATOR_SPECS"]
