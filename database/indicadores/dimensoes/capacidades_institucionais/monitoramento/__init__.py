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
_spec_6009 = _load_spec("6009")
INDICATOR_SPECS[_spec_6009.indicator_id] = _spec_6009
_spec_6054 = _load_spec("6054")
INDICATOR_SPECS[_spec_6054.indicator_id] = _spec_6054
_spec_6055 = _load_spec("6055")
INDICATOR_SPECS[_spec_6055.indicator_id] = _spec_6055

__all__ = ["INDICATOR_SPECS"]
