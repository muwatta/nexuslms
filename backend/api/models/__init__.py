# Backwards-compatible model alias package.
# Some parts of the codebase still import from api.models.
from api.core.models import *  # noqa: F401,F403
