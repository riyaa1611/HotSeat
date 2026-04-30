import pytest
from app.services.prompt_engine import get_persona_prompt, VALID_PERSONAS

SAMPLE_CONTEXT = "## Project: test-app\n### README\nA test app."


def test_valid_personas_list():
    assert set(VALID_PERSONAS) == {"investor", "tech_lead", "hr_manager", "product_manager"}


def test_get_persona_prompt_investor():
    prompt = get_persona_prompt("investor", SAMPLE_CONTEXT)
    assert "venture capital" in prompt.lower() or "investor" in prompt.lower()
    assert SAMPLE_CONTEXT in prompt
    assert "5 minutes" in prompt


def test_get_persona_prompt_tech_lead():
    prompt = get_persona_prompt("tech_lead", SAMPLE_CONTEXT)
    assert "tech lead" in prompt.lower() or "senior" in prompt.lower()
    assert SAMPLE_CONTEXT in prompt
    assert "architecture" in prompt.lower()


def test_get_persona_prompt_hr_manager():
    prompt = get_persona_prompt("hr_manager", SAMPLE_CONTEXT)
    assert "hr" in prompt.lower() or "behavioral" in prompt.lower() or "interview" in prompt.lower()
    assert SAMPLE_CONTEXT in prompt
    assert "two sentences" in prompt.lower()


def test_get_persona_prompt_product_manager():
    prompt = get_persona_prompt("product_manager", SAMPLE_CONTEXT)
    assert "product" in prompt.lower()
    assert SAMPLE_CONTEXT in prompt
    assert "one sentence" in prompt.lower()


def test_get_persona_prompt_invalid_raises():
    with pytest.raises(ValueError, match="Unknown persona"):
        get_persona_prompt("boss", SAMPLE_CONTEXT)


def test_all_prompts_contain_global_rules():
    for persona in VALID_PERSONAS:
        prompt = get_persona_prompt(persona, SAMPLE_CONTEXT)
        assert "1-3 sentences" in prompt.lower() or "one question" in prompt.lower()
