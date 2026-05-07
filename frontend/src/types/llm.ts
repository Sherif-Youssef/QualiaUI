export enum ProviderType {
    ALIBABA = "alibaba",
    ANTHROPIC = "anthropic",
    AZURE = "azure",
    BEDROCK = "bedrock",
    CEREBRAS = "cerebras",
    COHERE = "cohere",
    DEEPSEEK = "deepseek",
    FIREWORKS = "fireworks",
    GITHUB = "github",
    GOOGLE_GLA = "google-gla",
    GOOGLE_VERTEX = "google-vertex",
    GROK = "grok",
    GROQ = "groq",
    HEROKU = "heroku",
    HUGGINGFACE = "huggingface",
    LITELLM = "litellm",
    MISTRAL = "mistral",
    MOONSHOTAI = "moonshotai",
    NEBIUS = "nebius",
    OLLAMA = "ollama",
    OPENAI = "openai",
    OPENROUTER = "openrouter",
    OUTLINES = "outlines",
    OVHCLOUD = "ovhcloud",
    SAMBANOVA = "sambanova",
    SENTENCE_TRANSFORMERS = "sentence-transformers",
    TOGETHER = "together",
    VERCEL = "vercel",
    VOYAGEAI = "voyageai",
    XAI = "xai",
    GATEWAY_BEDROCK = "gateway/bedrock",
    GATEWAY_OPENAI = "gateway/openai",
    GATEWAY_ANTHROPIC = "gateway/anthropic",
    GATEWAY_GROQ = "gateway/groq",
    GATEWAY_GOOGLE_VERTEX = "gateway/google-vertex",
}

export const ProviderDisplayNames: Record<ProviderType, string> = {
    [ProviderType.ALIBABA]: "Alibaba",
    [ProviderType.ANTHROPIC]: "Anthropic",
    [ProviderType.AZURE]: "Azure",
    [ProviderType.BEDROCK]: "Bedrock",
    [ProviderType.CEREBRAS]: "Cerebras",
    [ProviderType.COHERE]: "Cohere",
    [ProviderType.DEEPSEEK]: "DeepSeek",
    [ProviderType.FIREWORKS]: "Fireworks",
    [ProviderType.GITHUB]: "GitHub",
    [ProviderType.GOOGLE_GLA]: "Google GLA",
    [ProviderType.GOOGLE_VERTEX]: "Google Vertex",
    [ProviderType.GROK]: "Grok",
    [ProviderType.GROQ]: "Groq",
    [ProviderType.HEROKU]: "Heroku",
    [ProviderType.HUGGINGFACE]: "Hugging Face",
    [ProviderType.LITELLM]: "LiteLLM",
    [ProviderType.MISTRAL]: "Mistral",
    [ProviderType.MOONSHOTAI]: "Moonshot AI",
    [ProviderType.NEBIUS]: "Nebius",
    [ProviderType.OLLAMA]: "Ollama",
    [ProviderType.OPENAI]: "OpenAI",
    [ProviderType.OPENROUTER]: "OpenRouter",
    [ProviderType.OUTLINES]: "Outlines",
    [ProviderType.OVHCLOUD]: "OVHcloud",
    [ProviderType.SAMBANOVA]: "SambaNova",
    [ProviderType.SENTENCE_TRANSFORMERS]: "Sentence Transformers",
    [ProviderType.TOGETHER]: "Together",
    [ProviderType.VERCEL]: "Vercel",
    [ProviderType.VOYAGEAI]: "Voyage AI",
    [ProviderType.XAI]: "xAI",
    [ProviderType.GATEWAY_BEDROCK]: "Pydantic AI Bedrock Gateway",
    [ProviderType.GATEWAY_OPENAI]: "Pydantic AI OpenAI",
    [ProviderType.GATEWAY_ANTHROPIC]: "Pydantic AI Anthropic Gateway",
    [ProviderType.GATEWAY_GROQ]: "Pydantic AI Groq Gateway",
    [ProviderType.GATEWAY_GOOGLE_VERTEX]: "Pydantic AI Google Vertex Gateway",
};

export interface LLMModel {
    id: number;
    model_name: string;
    display_name: string;
    provider_id: number;
}

export interface Provider {
    id: number;
    display_name: string;
    provider_type: ProviderType;
    base_url?: string;
    has_api_key: boolean;
    additional_config: Record<string, any>;
    llm_models: LLMModel[];
}

export interface ProviderCreate {
    display_name: string;
    provider_type: ProviderType;
    base_url?: string;
    api_key?: string;
    additional_config: Record<string, any>;
}

export interface ProviderUpdate {
    display_name?: string;
    provider_type?: ProviderType;
    base_url?: string;
    api_key?: string;
    additional_config?: Record<string, any>;
}

export interface LLMModelCreate {
    model_name: string;
    display_name: string;
    provider_id: number;
}

export interface LLMModelUpdate {
    model_name?: string;
    display_name?: string;
    provider_id?: number;
}
