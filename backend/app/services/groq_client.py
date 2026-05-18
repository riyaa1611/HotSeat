import asyncio
import logging
from groq import AsyncGroq, RateLimitError, APIConnectionError, APITimeoutError, InternalServerError, GroqError
from app.config import get_settings

logger = logging.getLogger(__name__)

_RETRYABLE = (RateLimitError, APIConnectionError, APITimeoutError, InternalServerError)
_MIN_RESPONSE_CHARS = 10


def _extract_content(completion) -> str:
    if not completion.choices:
        raise ValueError("LLM returned empty choices list")
    content = completion.choices[0].message.content
    if not content or not content.strip():
        raise ValueError("LLM returned empty or whitespace-only response")
    if len(content.strip()) < _MIN_RESPONSE_CHARS:
        raise ValueError(f"LLM response too short ({len(content.strip())} chars): {content!r}")
    return content.strip()


async def _call_model(
    client: AsyncGroq,
    model: str,
    messages: list[dict],
    max_tokens: int,
    temperature: float,
    response_format: dict | None,
) -> str:
    kwargs = dict(model=model, messages=messages, max_tokens=max_tokens, temperature=temperature)
    if response_format:
        kwargs["response_format"] = response_format
    completion = await client.chat.completions.create(**kwargs)
    return _extract_content(completion)


async def chat(
    messages: list[dict],
    max_retries: int = 3,
    base_delay: float = 1.0,
    temperature: float = 0.85,
    max_tokens: int = 512,
    response_format: dict | None = None,
) -> str:
    settings = get_settings()
    models = [settings.groq_model, settings.groq_model_fallback]

    for model_idx, model in enumerate(models):
        for attempt in range(max_retries):
            try:
                async with AsyncGroq(api_key=settings.groq_api_key) as client:
                    return await _call_model(client, model, messages, max_tokens, temperature, response_format)
            except _RETRYABLE as e:
                if attempt >= max_retries - 1:
                    if model_idx < len(models) - 1:
                        logger.warning("Primary model %s exhausted retries, trying fallback: %s", model, e)
                        break
                    logger.error("All models failed after retries: %s", e)
                    raise
                delay = base_delay * (2 ** (attempt + 1))
                logger.warning("Retryable error on %s (attempt %d/%d), retrying in %.1fs: %s", model, attempt + 1, max_retries, delay, e)
                await asyncio.sleep(delay)
            except (GroqError, ValueError) as e:
                if model_idx < len(models) - 1:
                    logger.warning("Model %s non-retryable error, trying fallback: %s", model, e)
                    break
                logger.error("All models failed: %s", e)
                raise
            except Exception as e:
                logger.error("Unexpected error calling Groq model %s: %s", model, e)
                raise

    raise RuntimeError("chat: all models exhausted without returning")


async def stream_chat(
    messages: list[dict],
    max_retries: int = 3,
    base_delay: float = 1.0,
    temperature: float = 0.85,
):
    settings = get_settings()
    models = [settings.groq_model, settings.groq_model_fallback]

    for model_idx, model in enumerate(models):
        for attempt in range(max_retries):
            try:
                async with AsyncGroq(api_key=settings.groq_api_key) as client:
                    stream = await client.chat.completions.create(
                        model=model,
                        messages=messages,
                        max_tokens=512,
                        temperature=temperature,
                        stream=True,
                    )
                    async for chunk in stream:
                        content = chunk.choices[0].delta.content
                        if content:
                            yield content
                return
            except _RETRYABLE as e:
                if attempt >= max_retries - 1:
                    if model_idx < len(models) - 1:
                        logger.warning("Stream: primary model %s exhausted, trying fallback: %s", model, e)
                        break
                    logger.error("Stream: all models failed after retries: %s", e)
                    raise
                delay = base_delay * (2 ** (attempt + 1))
                logger.warning("Stream retryable error on %s (attempt %d/%d), retrying in %.1fs: %s", model, attempt + 1, max_retries, delay, e)
                await asyncio.sleep(delay)
            except GroqError as e:
                if model_idx < len(models) - 1:
                    logger.warning("Stream: model %s non-retryable, trying fallback: %s", model, e)
                    break
                logger.error("Stream: all models failed: %s", e)
                raise
            except Exception as e:
                logger.error("Unexpected error in stream on model %s: %s", model, e)
                raise
