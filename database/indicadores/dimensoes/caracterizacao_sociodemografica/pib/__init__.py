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
_spec_3087 = _load_spec("3087")
INDICATOR_SPECS[_spec_3087.indicator_id] = _spec_3087
_spec_4056 = _load_spec("4056")
INDICATOR_SPECS[_spec_4056.indicator_id] = _spec_4056
_spec_4057 = _load_spec("4057")
INDICATOR_SPECS[_spec_4057.indicator_id] = _spec_4057
_spec_4058 = _load_spec("4058")
INDICATOR_SPECS[_spec_4058.indicator_id] = _spec_4058
_spec_4059 = _load_spec("4059")
INDICATOR_SPECS[_spec_4059.indicator_id] = _spec_4059

__all__ = ["INDICATOR_SPECS"]
