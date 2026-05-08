from pydantic import BaseModel, ConfigDict, Field
from enum import StrEnum

class ProviderType(StrEnum):
    ALIBABA = "alibaba"
    ANTHROPIC = "anthropic"
    AZURE = "azure"
    BEDROCK = "bedrock"
    CEREBRAS = "cerebras"
    COHERE = "cohere"
    DEEPSEEK = "deepseek"
    FIREWORKS = "fireworks"
    GITHUB = "github"
    GOOGLE_GLA = "google-gla"
    GOOGLE_VERTEX = "google-vertex"
    GROK = "grok"
    GROQ = "groq"
    HEROKU = "heroku"
    HUGGINGFACE = "huggingface"
    LITELLM = "litellm"
    MISTRAL = "mistral"
    MOONSHOTAI = "moonshotai"
    NEBIUS = "nebius"
    OLLAMA = "ollama"
    OPENAI = "openai"
    OPENROUTER = "openrouter"
    OUTLINES = "outlines"
    OVHCLOUD = "ovhcloud"
    SAMBANOVA = "sambanova"
    SENTENCE_TRANSFORMERS = "sentence-transformers"
    TOGETHER = "together"
    VERCEL = "vercel"
    VOYAGEAI = "voyageai"
    XAI = "xai"
    GATEWAY_BEDROCK = "gateway/bedrock"
    GATEWAY_OPENAI = "gateway/openai"
    GATEWAY_ANTHROPIC = "gateway/anthropic"
    GATEWAY_GROQ = "gateway/groq"
    GATEWAY_GOOGLE_VERTEX = "gateway/google-vertex"

    @property
    def display_name(self) -> str:
        mapping = {
            ProviderType.GOOGLE_GLA: "Google GLA",
            ProviderType.OPENAI: "OpenAI",
            ProviderType.MOONSHOTAI: "Moonshot AI",
            ProviderType.XAI: "xAI",
            ProviderType.GATEWAY_BEDROCK: "Pydantic AI Bedrock Gateway",
            ProviderType.GATEWAY_OPENAI: "Pydantic AI OpenAI",
            ProviderType.GATEWAY_ANTHROPIC: "Pydantic AI Anthropic Gateway",
            ProviderType.GATEWAY_GROQ: "Pydantic AI Groq Gateway",
            ProviderType.GATEWAY_GOOGLE_VERTEX: "Pydantic AI Google Vertex Gateway",
        }
        return mapping.get(self, self.value.replace("-", " ").replace("/", " ").title())

class LLMModelBase(BaseModel):
    model_name: str
    display_name: str
    


class LLMModelCreate(LLMModelBase):
    provider_id: int
    pass


class LLMModelUpdate(BaseModel):
    model_name: str | None = None
    display_name: str | None = None
    provider_id: int | None = None


class LLMModelListRead(LLMModelBase):
    id: int
    provider_id: int
    model_config = ConfigDict(from_attributes=True)


class ProviderBase(BaseModel):
    display_name: str
    provider_type: ProviderType
    base_url: str | None = None
    additional_config: dict = Field(default_factory=dict)


class ProviderCreate(ProviderBase):
    api_key: str | None = None


class ProviderUpdate(BaseModel):
    display_name: str | None = None
    provider_type: ProviderType | None = None
    base_url: str | None = None
    api_key: str | None = None
    additional_config: dict | None = None

class ProviderBaseRead(ProviderBase):
    id: int
    has_api_key: bool = False


class LLMModelRead(LLMModelBase):
    id: int
    provider: ProviderBaseRead
    model_config = ConfigDict(from_attributes=True)


class ProviderRead(ProviderBaseRead):
    llm_models: list[LLMModelListRead] = Field(default_factory=list)
    model_config = ConfigDict(from_attributes=True)


class ProviderApiKeyRead(BaseModel):
    api_key: str | None = None


class ProviderApiKeyUpdate(BaseModel):
    api_key: str | None = None
