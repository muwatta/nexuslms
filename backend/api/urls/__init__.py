"""
Package shim so `include('api.urls')` resolves to the URL patterns
defined in the top-level module `api/urls.py` (avoids package/module
name collision when both `api/urls.py` and `api/urls/__init__.py`
exist).
"""
from importlib import import_module

try:
	_mod = import_module("api.urls")
	urlpatterns = getattr(_mod, "urlpatterns", [])
except Exception:
	# Fallback to empty list to let Django report a clearer error later
	urlpatterns = []
