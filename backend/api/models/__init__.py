# Backwards-compatible model alias package.
# Some parts of the codebase still import from api.models.
from api.core.models import *

__all__ = getattr(sys.modules[__name__], "__all__", None)
