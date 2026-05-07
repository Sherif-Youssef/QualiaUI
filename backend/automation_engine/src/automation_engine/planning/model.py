from typing import Any

from pydantic_ai.models import infer_provider_class, Model, infer_model
from pydantic_ai.providers import Provider


def create_provider(
    provider: str,
    *,
    api_key: str | None = None,
    base_url: str | None = None,
    **kwargs: Any,
) -> Provider:
    """
    Create a PydanticAI provider instance.
    """
    provider_cls = infer_provider_class(provider)

    provider_kwargs: dict[str, Any] = {**kwargs}

    if api_key is not None:
        provider_kwargs["api_key"] = api_key

    if base_url is not None:
        provider_kwargs["base_url"] = base_url

    return provider_cls(**provider_kwargs)


def create_model(provider: str, model: str | None = None, **kwargs: Any) -> Model:
    """
    Create a PydanticAI model instance.
    """
    provider_instance = create_provider(provider, **kwargs)
    return infer_model(model, provider_factory=lambda _: provider_instance)
