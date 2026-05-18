import asyncio
import logging
from groq import AsyncGroq, RateLimitError, APIConnectionError, APITimeoutError, InternalServerError, GroqError
from app.config import get_settings

logger = logging.getLogger(__name__)

_RETRYABLE = (RateLimitError, APIConnectionError, APITimeoutError, InternalServerError)


def _extract_content(completion) -> str:
    if not completion.choices:
        raise ValueError("LLM returned empty choices list")
    content = completion.choices[0].message.content
    if not content or not content.strip():
        raise ValueError("LLM returned empty or whitespace-only response")
    return content.strip()


async def chat(
    messages: list[dict],
    max_retries: int = 3,
    base_delay: float = 1.0,
    temperature: float = 0.85,
    max_tokens: int = 512,
) -> str:
    settings = get_settings()

    for attempt in range(max_retries):
        try:
            async with AsyncGroq(api_key=settings.groq_api_key) as client:
                completion = await client.chat.completions.create(
                    model=settings.groq_model,
                    messages=messages,
                    max_tokens=max_tokens,
                    temperature=temperature,
                )
            return _extract_content(completion)
        except _RETRYABLE as e:
            if attempt >= max_retries - 1:
                logger.error("Groq API failed after %d retries: %s", max_retries, e)
                raise
            delay = base_delay * (2 ** (attempt + 1))
            logger.warning("Groq retryable error (attempt %d/%d), retrying in %.1fs: %s", attempt + 1, max_retries, delay, e)
            await asyncio.sleep(delay)
        except GroqError as e:
            logger.error("Groq non-retryable API error: %s", e)
            raise
        except ValueError:
            raise
        except Exception as e:
            logger.error("Unexpected error calling Groq: %s", e)
            raise

    raise RuntimeError("chat: exhausted retries without returning")


async def stream_chat(messages: list[dict], max_retries: int = 3, base_delay: float = 1.0, temperature: float = 0.85):
    settings = get_settings()

    for attempt in range(max_retries):
        try:
            async with AsyncGroq(api_key=settings.groq_api_key) as client:
                stream = await client.chat.completions.create(
                    model=settings.groq_model,
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
                logger.error("Groq stream failed after %d retries: %s", max_retries, e)
                raise
            delay = base_delay * (2 ** (attempt + 1))
            logger.warning("Groq stream retryable error (attempt %d/%d), retrying in %.1fs: %s", attempt + 1, max_retries, delay, e)
            await asyncio.sleep(delay)
        except GroqError as e:
            logger.error("Groq non-retryable stream error: %s", e)
            raise
        except Exception as e:
            logger.error("Unexpected error in Groq stream: %s", e)
            raise
