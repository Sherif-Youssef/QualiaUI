from sqlmodel import Column, Field, JSON, Relationship, SQLModel
from .schemas import ProviderType

class Provider(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    display_name: str = Field()
    provider_type: ProviderType = Field()
    base_url: str | None = Field(default=None)
    api_key: str | None = Field(default=None)

    additional_config: dict = Field(default_factory=lambda: {}, sa_column=Column(JSON))

    llm_models: list["LLMModel"] = Relationship(back_populates="provider", cascade_delete=True)


class LLMModel(SQLModel, table=True):
    __tablename__ = "llm_model"

    id: int | None = Field(default=None, primary_key=True)
    model_name: str = Field()
    display_name: str = Field()
    
    provider_id: int = Field(foreign_key="provider.id", ondelete="CASCADE")
    provider: "Provider" = Relationship(back_populates="llm_models")

