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
_spec_6002 = _load_spec("6002")
INDICATOR_SPECS[_spec_6002.indicator_id] = _spec_6002
_spec_6011 = _load_spec("6011")
INDICATOR_SPECS[_spec_6011.indicator_id] = _spec_6011
_spec_6017 = _load_spec("6017")
INDICATOR_SPECS[_spec_6017.indicator_id] = _spec_6017
_spec_6019 = _load_spec("6019")
INDICATOR_SPECS[_spec_6019.indicator_id] = _spec_6019
_spec_6020 = _load_spec("6020")
INDICATOR_SPECS[_spec_6020.indicator_id] = _spec_6020
_spec_6057 = _load_spec("6057")
INDICATOR_SPECS[_spec_6057.indicator_id] = _spec_6057
_spec_6058 = _load_spec("6058")
INDICATOR_SPECS[_spec_6058.indicator_id] = _spec_6058
_spec_6059 = _load_spec("6059")
INDICATOR_SPECS[_spec_6059.indicator_id] = _spec_6059

__all__ = ["INDICATOR_SPECS"]
