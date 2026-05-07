from typing import Annotated
from fastapi import Depends, HTTPException, Path
from src.database import SessionDep
from .models import Provider, LLMModel
from .queries import get_provider_by_id, get_model_by_id


def get_provider(
    session: SessionDep,
    provider_id: int = Path(...),
) -> Provider:
    provider = get_provider_by_id(session, provider_id)
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    return provider


def get_model(
    session: SessionDep,
    model_id: int = Path(...),
) -> LLMModel:
    model = get_model_by_id(session, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="LLM Model not found")
    return model


ProviderDep = Annotated[Provider, Depends(get_provider)]
LLMModelDep = Annotated[LLMModel, Depends(get_model)]
