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
_spec_3058 = _load_spec("3058")
INDICATOR_SPECS[_spec_3058.indicator_id] = _spec_3058
_spec_4061 = _load_spec("4061")
INDICATOR_SPECS[_spec_4061.indicator_id] = _spec_4061
_spec_4062 = _load_spec("4062")
INDICATOR_SPECS[_spec_4062.indicator_id] = _spec_4062
_spec_4063 = _load_spec("4063")
INDICATOR_SPECS[_spec_4063.indicator_id] = _spec_4063
_spec_4064 = _load_spec("4064")
INDICATOR_SPECS[_spec_4064.indicator_id] = _spec_4064

__all__ = ["INDICATOR_SPECS"]
