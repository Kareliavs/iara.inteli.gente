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
_spec_6021 = _load_spec("6021")
INDICATOR_SPECS[_spec_6021.indicator_id] = _spec_6021
_spec_6024 = _load_spec("6024")
INDICATOR_SPECS[_spec_6024.indicator_id] = _spec_6024

__all__ = ["INDICATOR_SPECS"]
