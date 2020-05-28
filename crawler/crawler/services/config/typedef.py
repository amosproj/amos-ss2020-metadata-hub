"""Type definition of a crawler configuration"""


# Python imports
from json import dumps


class Config:
    """Wrapper class for the configuration"""

    def __init__(self, data: dict):
        self._data = data
        self._paths = data.get('paths')
        self._options = data.get('options')

    def get_paths_inputs(self) -> list:
        return self._paths.get('inputs')

    def get_paths_output(self) -> str:
        return self._paths.get('output')

    def get_paths_exiftool(self) -> str:
        return self._paths.get('exiftool')

    def get_paths_trace(self) -> str:
        return self._paths.get('trace')

    def get_options_power_level(self) -> int:
        return self._options.get('powerLevel')

    def get_options_clear_trace(self) -> bool:
            return self._options.get('clearTrace')

    def get_options_file_types(self) -> list:
            return self._options.get('fileTypes')

    def get_options_language(self) -> str:
        return self._options.get('language')

    def get_options_package_size(self) -> int:
        return self._options.get('packageSize')

    def __str__(self) -> str:
        return dumps(self._data)
