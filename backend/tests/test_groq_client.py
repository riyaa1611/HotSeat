import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from app.services.groq_client import chat


@pytest.mark.asyncio
async def test_chat_returns_string():
    messages = [
        {"role": "system", "content": "You are a tester."},
        {"role": "user", "content": "Hello"},
    ]

    mock_completion = MagicMock()
    mock_completion.choices = [MagicMock()]
    mock_completion.choices[0].message.content = "Test response"

    with patch("app.services.groq_client.AsyncGroq") as MockGroq:
        instance = AsyncMock()
        instance.chat.completions.create = AsyncMock(return_value=mock_completion)
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        MockGroq.return_value = instance

        result = await chat(messages)

    assert result == "Test response"


@pytest.mark.asyncio
async def test_chat_retries_on_rate_limit():
    messages = [{"role": "user", "content": "Hello"}]

    mock_completion = MagicMock()
    mock_completion.choices = [MagicMock()]
    mock_completion.choices[0].message.content = "Retry succeeded"

    call_count = 0

    async def flaky_create(*args, **kwargs):
        nonlocal call_count
        call_count += 1
        if call_count < 2:
            import httpx
            from groq import RateLimitError
            request = httpx.Request("POST", "https://api.groq.com/")
            raise RateLimitError(
                "rate limit",
                response=httpx.Response(429, request=request),
                body={},
            )
        return mock_completion

    with patch("app.services.groq_client.AsyncGroq") as MockGroq:
        instance = AsyncMock()
        instance.chat.completions.create = flaky_create
        instance.__aenter__ = AsyncMock(return_value=instance)
        instance.__aexit__ = AsyncMock(return_value=False)
        MockGroq.return_value = instance

        with patch("app.services.groq_client.asyncio.sleep", new_callable=AsyncMock):
            result = await chat(messages, max_retries=3)

    assert result == "Retry succeeded"
    assert call_count == 2
