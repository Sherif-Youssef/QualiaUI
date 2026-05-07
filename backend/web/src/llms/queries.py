from sqlmodel import Session, col, select
from sqlalchemy import func
from sqlalchemy.orm import selectinload

from src.base.schemas import PaginationParams
from .models import Provider, LLMModel
from .schemas import ProviderType


def get_provider_by_id(session: Session, provider_id: int, load_models: bool = True) -> Provider | None:
    statement = select(Provider).where(col(Provider.id) == provider_id)
    if load_models:
        statement = statement.options(
            selectinload(Provider.llm_models)
        )
    return session.exec(statement).first()


def get_all_providers(
    session: Session,
    pagination_params: PaginationParams,
    display_name: str | None = None,
    provider_type: ProviderType | None = None,
) -> list[Provider]:
    statement = select(Provider)
    if display_name:
        statement = statement.where(func.lower(col(Provider.display_name)).ilike(f"%{display_name.lower()}%"))
    if provider_type:
        statement = statement.where(col(Provider.provider_type) == provider_type)
    
    statement = (
        statement
        .order_by(col(Provider.id).asc())
        .limit(pagination_params.limit)
        .offset(pagination_params.offset)
    )
    return list(session.exec(statement).all())


def count_providers(session: Session, display_name: str | None = None, provider_type: ProviderType | None = None) -> int:
    statement = select(func.count(col(Provider.id)))
    if display_name:
        statement = statement.where(func.lower(col(Provider.display_name)).ilike(f"%{display_name.lower()}%"))
    if provider_type:
        statement = statement.where(col(Provider.provider_type) == provider_type)
    return session.exec(statement).one()  # type: ignore


def get_model_by_id(session: Session, model_id: int) -> LLMModel | None:
    statement = select(LLMModel).where(col(LLMModel.id) == model_id)
    return session.exec(statement).first()


def get_all_models(
    session: Session,
    pagination_params: PaginationParams,
    display_name: str | None = None,
    provider_id: int | None = None,
) -> list[LLMModel]:
    statement = select(LLMModel)
    if display_name:
        statement = statement.where(func.lower(col(LLMModel.display_name)).ilike(f"%{display_name.lower()}%"))
    if provider_id:
        statement = statement.where(col(LLMModel.provider_id) == provider_id)
    
    statement = (
        statement
        .order_by(col(LLMModel.id).asc())
        .limit(pagination_params.limit)
        .offset(pagination_params.offset)
    )
    return list(session.exec(statement).all())


def count_models(session: Session, display_name: str | None = None, provider_id: int | None = None) -> int:
    statement = select(func.count(col(LLMModel.id)))
    if display_name:
        statement = statement.where(func.lower(col(LLMModel.display_name)).ilike(f"%{display_name.lower()}%"))
    if provider_id:
        statement = statement.where(col(LLMModel.provider_id) == provider_id)
    return session.exec(statement).one()  # type: ignore


def delete_provider(session: Session, provider: Provider) -> None:
    session.delete(provider)


def delete_model(session: Session, model: LLMModel) -> None:
    session.delete(model)
