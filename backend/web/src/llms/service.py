from sqlmodel import Session
from src.base.schemas import PaginationParams, Page
from .models import Provider, LLMModel
from .queries import (
    get_all_providers, count_providers, delete_provider as delete_provider_query,
    get_all_models, count_models, delete_model as delete_model_query
)
from .schemas import ProviderCreate, ProviderUpdate, LLMModelCreate, LLMModelUpdate, ProviderType, ProviderRead

# Providers

def list_providers(
    session: Session,
    pagination_params: PaginationParams,
    display_name: str | None = None,
    provider_type: ProviderType | None = None,
) -> Page[ProviderRead]:
    providers = get_all_providers(session, pagination_params, display_name=display_name, provider_type=provider_type)
    total_items = count_providers(session, display_name=display_name, provider_type=provider_type)

    provider_reads = []
    for p in providers:
        p_read = ProviderRead.model_validate(p)
        p_read.has_api_key = bool(p.api_key)
        provider_reads.append(p_read)

    return Page(
        items=provider_reads,
        offset=pagination_params.offset,
        limit=pagination_params.limit,
        total_items=total_items,
    )


def create_provider(session: Session, provider_create: ProviderCreate) -> ProviderRead:
    provider = Provider.model_validate(provider_create)
    session.add(provider)
    session.commit()
    session.refresh(provider)
    
    p_read = ProviderRead.model_validate(provider)
    p_read.has_api_key = bool(provider.api_key)
    return p_read


def update_provider(session: Session, provider: Provider, provider_update: ProviderUpdate) -> ProviderRead:
    update_data = provider_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(provider, key, value)
    
    session.add(provider)
    session.commit()
    session.refresh(provider)
    
    p_read = ProviderRead.model_validate(provider)
    p_read.has_api_key = bool(provider.api_key)
    return p_read


def get_provider_api_key(provider: Provider) -> str | None:
    return provider.api_key


def update_provider_api_key(session: Session, provider: Provider, api_key: str | None) -> None:
    provider.api_key = api_key
    session.add(provider)
    session.commit()


def delete_provider(session: Session, provider: Provider) -> None:
    delete_provider_query(session, provider)
    session.commit()

# Models

def list_models(
    session: Session,
    pagination_params: PaginationParams,
    display_name: str | None = None,
    provider_id: int | None = None,
) -> Page[LLMModel]:
    models = get_all_models(session, pagination_params, display_name=display_name, provider_id=provider_id)
    total_items = count_models(session, display_name=display_name, provider_id=provider_id)

    return Page(
        items=models,
        offset=pagination_params.offset,
        limit=pagination_params.limit,
        total_items=total_items,
    )


def create_model(session: Session, model_create: LLMModelCreate) -> LLMModel:
    model = LLMModel.model_validate(model_create)
    session.add(model)
    session.commit()
    session.refresh(model)
    return model


def update_model(session: Session, model: LLMModel, model_update: LLMModelUpdate) -> LLMModel:
    update_data = model_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(model, key, value)
    
    session.add(model)
    session.commit()
    session.refresh(model)
    return model


def delete_model(session: Session, model: LLMModel) -> None:
    delete_model_query(session, model)
    session.commit()
