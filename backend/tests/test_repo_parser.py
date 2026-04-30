import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.repo_parser import parse_repo, extract_owner_repo


def test_extract_owner_repo_standard():
    owner, repo = extract_owner_repo("https://github.com/octocat/Hello-World")
    assert owner == "octocat"
    assert repo == "Hello-World"


def test_extract_owner_repo_trailing_slash():
    owner, repo = extract_owner_repo("https://github.com/octocat/Hello-World/")
    assert owner == "octocat"
    assert repo == "Hello-World"


def test_extract_owner_repo_invalid():
    with pytest.raises(ValueError, match="Invalid GitHub URL"):
        extract_owner_repo("https://notgithub.com/foo/bar")


@pytest.mark.asyncio
async def test_parse_repo_returns_expected_keys():
    mock_response_readme = MagicMock()
    mock_response_readme.status_code = 200
    mock_response_readme.text = "# My Project\nA test project."

    mock_response_tree = MagicMock()
    mock_response_tree.status_code = 200
    mock_response_tree.json.return_value = {
        "tree": [
            {"path": "README.md", "type": "blob"},
            {"path": "src/main.py", "type": "blob"},
            {"path": "src/", "type": "tree"},
        ]
    }

    mock_response_pkg = MagicMock()
    mock_response_pkg.status_code = 404

    async def mock_get(url, **kwargs):
        if "readme" in url.lower():
            return mock_response_readme
        elif "trees" in url:
            return mock_response_tree
        else:
            return mock_response_pkg

    with patch("app.services.repo_parser.httpx.AsyncClient") as MockClient:
        instance = AsyncMock()
        instance.get = AsyncMock(side_effect=mock_get)
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        MockClient.return_value = instance

        result = await parse_repo("https://github.com/octocat/Hello-World")

    assert result["repo_name"] == "Hello-World"
    assert result["owner"] == "octocat"
    assert "readme" in result
    assert "file_tree" in result
    assert "key_files" in result
    assert "My Project" in result["readme"]
    assert isinstance(result["file_tree"], list)
    # Only blob files in tree, not directories
    assert "src/" not in result["file_tree"]


@pytest.mark.asyncio
async def test_parse_repo_caps_readme_at_4000_chars():
    long_readme = "x" * 10000

    mock_readme = MagicMock()
    mock_readme.status_code = 200
    mock_readme.text = long_readme

    mock_tree = MagicMock()
    mock_tree.status_code = 200
    mock_tree.json.return_value = {"tree": []}

    async def mock_get(url, **kwargs):
        if "readme" in url.lower():
            return mock_readme
        elif "trees" in url:
            return mock_tree
        return MagicMock(status_code=404)

    with patch("app.services.repo_parser.httpx.AsyncClient") as MockClient:
        instance = AsyncMock()
        instance.get = AsyncMock(side_effect=mock_get)
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        MockClient.return_value = instance

        result = await parse_repo("https://github.com/octocat/Hello-World")

    assert len(result["readme"]) <= 4000
