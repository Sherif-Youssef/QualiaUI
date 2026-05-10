from __future__ import annotations

from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict

from automation_engine.planning import PlanningMode, mode_presets


class BrowserConfig(BaseModel):
    """Browser launch settings."""
    model_config = ConfigDict(frozen=True)

    headless: bool = False
    viewport_width: int = 1920
    viewport_height: int = 1080
    default_timeout: int = 60000  # 1 minute
    default_navigation_timeout: int = 120000  # 2 minutes
    record_video_dir: str | Path | None = None
    cookies: list[dict] | None = None

class LLMConfig(BaseModel):
    """Controls how the LLM is prompted and how its output is parsed."""
    model_config = ConfigDict(frozen=True, arbitrary_types_allowed=True)

    provider: str = Field(default="openai", description="LLM provider to use (e.g. 'openai', 'azure', 'anthropic').")
    model: str = Field(default="gpt-5.4-mini", description="Model name (e.g. 'gpt-4-0613'). If None, a provider-specific default will be used.")
    api_key: str | None = Field(default=None, description="API key for the LLM provider. If None, will look for environment variable.")
    base_url: str | None = Field(default=None, description="Base URL for the LLM provider API (for custom endpoints).")
    additional_kwargs: dict = Field(default_factory=dict, description="Additional kwargs to pass to the LLM provider.")

    planning_mode: PlanningMode = mode_presets.SINGLE_FULL
    use_tool_calling: bool = Field(default=True, description="True = structured output / tool calling, False = raw JSON in prompt.")
    use_screenshot: bool = Field(default=False, description="Attach a page screenshot to every LLM call.")


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
