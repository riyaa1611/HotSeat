from app.services.context_builder import build_context


SAMPLE_PARSED = {
    "repo_name": "my-app",
    "owner": "alice",
    "readme": "# My App\nA cool project.",
    "file_tree": ["src/main.py", "src/utils.py", "tests/test_main.py"],
    "key_files": {
        "requirements.txt": "fastapi\nhttpx\n",
        "Dockerfile": "FROM python:3.11\nCOPY . .",
    },
}


def test_build_context_contains_repo_name():
    ctx = build_context(SAMPLE_PARSED)
    assert "my-app" in ctx


def test_build_context_contains_readme():
    ctx = build_context(SAMPLE_PARSED)
    assert "My App" in ctx


def test_build_context_contains_file_tree():
    ctx = build_context(SAMPLE_PARSED)
    assert "src/main.py" in ctx


def test_build_context_contains_key_files():
    ctx = build_context(SAMPLE_PARSED)
    assert "requirements.txt" in ctx
    assert "fastapi" in ctx


def test_build_context_hard_cap():
    big_readme = "x" * 20000
    parsed = {**SAMPLE_PARSED, "readme": big_readme}
    ctx = build_context(parsed)
    assert len(ctx) <= 8000


def test_build_context_empty_key_files():
    parsed = {**SAMPLE_PARSED, "key_files": {}}
    ctx = build_context(parsed)
    assert "my-app" in ctx
    assert "requirements.txt" not in ctx
