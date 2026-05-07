from fastapi import APIRouter, Depends, status, Query
from src.auth.dependencies import UserDep, AdminUserDep
from src.database import SessionDep
from src.base.schemas import Page, PaginationParams
from .dependencies import ProviderDep, LLMModelDep
from .schemas import (
    ProviderCreate, ProviderRead, ProviderUpdate,
    LLMModelCreate, LLMModelRead, LLMModelUpdate,
    ProviderType
)
from .service import (
    create_provider, update_provider, delete_provider, list_providers,
    create_model, update_model, delete_model, list_models
)

router = APIRouter(prefix="/llms", tags=["llms"])


# Providers

@router.get("/providers", response_model=Page[ProviderRead])
async def list_providers_route(
    session: SessionDep,
    user: UserDep,
    pagination_params: PaginationParams = Depends(),
    display_name: str | None = Query(None),
    provider_type: ProviderType | None = Query(None),
):
    return list_providers(
        session=session,
        pagination_params=pagination_params,
        display_name=display_name,
        provider_type=provider_type
    )


@router.get("/providers/{provider_id}", response_model=ProviderRead)
async def get_provider_route(
    user: UserDep,
    provider: ProviderDep,
):
    return provider


@router.post("/providers", status_code=status.HTTP_201_CREATED, response_model=ProviderRead)
async def create_provider_route(
    session: SessionDep,
    user: AdminUserDep,
    provider_create: ProviderCreate,
):
    return create_provider(session=session, provider_create=provider_create)


@router.put("/providers/{provider_id}", response_model=ProviderRead)
async def update_provider_route(
    session: SessionDep,
    user: AdminUserDep,
    provider: ProviderDep,
    provider_update: ProviderUpdate,
):
    return update_provider(
        session=session,
        provider=provider,
        provider_update=provider_update
    )


@router.delete("/providers/{provider_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_provider_route(
    session: SessionDep,
    user: AdminUserDep,
    provider: ProviderDep,
):
    delete_provider(session=session, provider=provider)


# Models
@router.get("/models", response_model=Page[LLMModelRead])
async def list_models_route(
    session: SessionDep,
    user: UserDep,
    pagination_params: PaginationParams = Depends(),
    display_name: str | None = Query(None),
    provider_id: int | None = Query(None),
):
    return list_models(
        session=session,
        pagination_params=pagination_params,
        display_name=display_name,
        provider_id=provider_id
    )


@router.get("/models/{model_id}", response_model=LLMModelRead)
async def get_model_route(
    user: UserDep,
    model: LLMModelDep,
):
    return model


@router.post("/models", status_code=status.HTTP_201_CREATED, response_model=LLMModelRead)
async def create_model_route(
    session: SessionDep,
    user: AdminUserDep,
    model_create: LLMModelCreate,
):
    return create_model(session=session, model_create=model_create)


@router.put("/models/{model_id}", response_model=LLMModelRead)
async def update_model_route(
    session: SessionDep,
    user: AdminUserDep,
    model: LLMModelDep,
    model_update: LLMModelUpdate,
):
    return update_model(
        session=session,
        model=model,
        model_update=model_update
    )


@router.delete("/models/{model_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_model_route(
    session: SessionDep,
    user: AdminUserDep,
    model: LLMModelDep,
):
    delete_model(session=session, model=model)
