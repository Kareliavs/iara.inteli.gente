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
_spec_3059 = _load_spec("3059")
INDICATOR_SPECS[_spec_3059.indicator_id] = _spec_3059
_spec_3060 = _load_spec("3060")
INDICATOR_SPECS[_spec_3060.indicator_id] = _spec_3060
_spec_4050 = _load_spec("4050")
INDICATOR_SPECS[_spec_4050.indicator_id] = _spec_4050
_spec_4051 = _load_spec("4051")
INDICATOR_SPECS[_spec_4051.indicator_id] = _spec_4051
_spec_4052 = _load_spec("4052")
INDICATOR_SPECS[_spec_4052.indicator_id] = _spec_4052
_spec_4053 = _load_spec("4053")
INDICATOR_SPECS[_spec_4053.indicator_id] = _spec_4053
_spec_4054 = _load_spec("4054")
INDICATOR_SPECS[_spec_4054.indicator_id] = _spec_4054
_spec_4055 = _load_spec("4055")
INDICATOR_SPECS[_spec_4055.indicator_id] = _spec_4055
_spec_4060 = _load_spec("4060")
INDICATOR_SPECS[_spec_4060.indicator_id] = _spec_4060
_spec_4161 = _load_spec("4161")
INDICATOR_SPECS[_spec_4161.indicator_id] = _spec_4161

__all__ = ["INDICATOR_SPECS"]
