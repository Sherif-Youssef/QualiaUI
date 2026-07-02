import pytest

from src.llms.schemas import (
    ProviderCreate, ProviderUpdate, ProviderType,
    LLMModelCreate, LLMModelUpdate
)
from src.llms.service import (
    create_provider, update_provider, delete_provider, list_providers,
    get_provider_api_key, update_provider_api_key,
    create_model, update_model, delete_model, list_models
)
from src.llms.queries import get_provider_by_id, get_model_by_id
from src.base.schemas import PaginationParams

from tests.conftest import make_provider, make_llm_model


class TestProviderService:
    def test_create_provider(self, session):
        data = ProviderCreate(
            display_name="My OpenAI",
            provider_type=ProviderType.OPENAI,
            api_key="sk-test",
        )
        provider = create_provider(session, data)
        assert provider.id is not None
        assert provider.display_name == "My OpenAI"
        assert provider.has_api_key is True

        db_provider = get_provider_by_id(session, provider.id)
        assert db_provider.api_key == "sk-test"

    def test_update_provider(self, session):
        provider = make_provider(session, display_name="Old", provider_type=ProviderType.OPENAI)
        
        updated = update_provider(
            session, provider, ProviderUpdate(display_name="New", provider_type=ProviderType.ANTHROPIC)
        )
        assert updated.display_name == "New"
        assert updated.provider_type == ProviderType.ANTHROPIC

    def test_delete_provider(self, session):
        provider = make_provider(session, display_name="ToDelete")
        provider_id = provider.id
        
        delete_provider(session, provider)
        assert get_provider_by_id(session, provider_id) is None

    def test_list_providers(self, session):
        make_provider(session, display_name="P1")
        make_provider(session, display_name="P2")
        
        page = list_providers(session, PaginationParams(offset=0, limit=25))
        assert page.total_items == 2

    def test_list_providers_filter(self, session):
        make_provider(session, display_name="Alpha")
        make_provider(session, display_name="Beta")
        
        page = list_providers(session, PaginationParams(offset=0, limit=25), display_name="alpha")
        assert page.total_items == 1
        assert page.items[0].display_name == "Alpha"

    def test_api_key_management(self, session):
        provider = make_provider(session, api_key="initial")
        
        assert get_provider_api_key(provider) == "initial"
        
        update_provider_api_key(session, provider, "new_key")
        assert get_provider_api_key(provider) == "new_key"
        
        update_provider_api_key(session, provider, None)
        assert get_provider_api_key(provider) is None


class TestLLMModelService:
    def test_create_model(self, session):
        provider = make_provider(session)
        
        data = LLMModelCreate(
            model_name="gpt-4",
            display_name="GPT-4",
            provider_id=provider.id,
        )
        model = create_model(session, data)
        assert model.id is not None
        assert model.model_name == "gpt-4"
        assert model.provider_id == provider.id

    def test_update_model(self, session):
        provider = make_provider(session)
        model = make_llm_model(session, provider, model_name="old")
        
        updated = update_model(
            session, model, LLMModelUpdate(model_name="new")
        )
        assert updated.model_name == "new"

    def test_delete_model(self, session):
        provider = make_provider(session)
        model = make_llm_model(session, provider)
        model_id = model.id
        
        delete_model(session, model)
        assert get_model_by_id(session, model_id) is None

    def test_list_models(self, session):
        p1 = make_provider(session)
        p2 = make_provider(session)
        
        make_llm_model(session, p1, display_name="M1")
        make_llm_model(session, p1, display_name="M2")
        make_llm_model(session, p2, display_name="M3")
        
        # Test total list
        page = list_models(session, PaginationParams(offset=0, limit=25))
        assert page.total_items == 3

        # Test filter by provider
        page = list_models(session, PaginationParams(offset=0, limit=25), provider_id=p1.id)
        assert page.total_items == 2
        
        # Test filter by name
        page = list_models(session, PaginationParams(offset=0, limit=25), display_name="M3")
        assert page.total_items == 1
        assert page.items[0].display_name == "M3"
