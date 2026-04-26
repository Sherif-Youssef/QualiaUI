from __future__ import annotations

from pydantic import BaseModel, Field, ConfigDict

from automation_engine.planning import PlanningMode, mode_presets


class BrowserConfig(BaseModel):
    """Browser launch settings."""
    model_config = ConfigDict(frozen=True)

    headless: bool = False
    viewport_width: int = 1280
    viewport_height: int = 780


class LLMConfig(BaseModel):
    """Controls how the LLM is prompted and how its output is parsed."""
    model_config = ConfigDict(frozen=True, arbitrary_types_allowed=True)

    planning_mode: PlanningMode = mode_presets.GROUP_FULL
    use_tool_calling: bool = Field(default=True, description="True = structured output / tool calling, False = raw JSON in prompt.")
    use_screenshot: bool = Field(default=True, description="Attach a page screenshot to every LLM call.")


class ExecutionConfig(BaseModel):
    """Guardrails for the automation loop."""
    model_config = ConfigDict(frozen=True)

    max_steps: int = Field(default=50, ge=1, description="Abort after this many steps.")
    # TODO: needs support
    max_errors: int = Field(default=1, ge=0, description="Abort after this many consecutive errors.")


class EngineConfig(BaseModel):
    """Top-level configuration - compose all sub-configs."""
    model_config = ConfigDict(frozen=True)

    browser: BrowserConfig = Field(default_factory=BrowserConfig)
    llm: LLMConfig = Field(default_factory=LLMConfig)
    execution: ExecutionConfig = Field(default_factory=ExecutionConfig)
