import pytest
from app.config import get_settings
from app.main import app
from app.auth import get_current_user

TEST_USER_ID = "test-user-00000000-0000-0000-0000-000000000000"


@pytest.fixture(autouse=True)
def reset_settings_cache():
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture(autouse=True)
def override_auth():
    app.dependency_overrides[get_current_user] = lambda: TEST_USER_ID
    yield
    app.dependency_overrides.pop(get_current_user, None)
