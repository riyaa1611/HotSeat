import pytest
from app.config import get_settings


@pytest.fixture(autouse=True)
def reset_settings_cache():
    """Clear lru_cache before each test so env overrides take effect."""
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()
