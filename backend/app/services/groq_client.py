import asyncio
from groq import AsyncGroq, RateLimitError
from app.config import get_settings


async def chat(
    messages: list[dict],
    max_retries: int = 3,
    base_delay: float = 1.0,
) -> str:
    settings = get_settings()
    attempt = 0

    while attempt < max_retries:
        try:
            async with AsyncGroq(api_key=settings.groq_api_key) as client:
                completion = await client.chat.completions.create(
                    model=settings.groq_model,
                    messages=messages,
                    max_tokens=512,
                    temperature=0.85,
                )
            return completion.choices[0].message.content
        except RateLimitError:
            attempt += 1
            if attempt >= max_retries:
                raise
            await asyncio.sleep(base_delay * (2 ** attempt))
