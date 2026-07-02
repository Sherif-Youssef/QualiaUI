from fastapi.testclient import TestClient
from datetime import timedelta

from src.auth.models import Role as AuthRole
from src.auth.service import create_token
from src.auth.schemas import TokenType
from src.llms.schemas import ProviderType

from tests.conftest import make_user, make_provider, make_llm_model


def auth_header(user_id: int) -> dict[str, str]:
    token = create_token(user_id, TokenType.ACCESS, timedelta(minutes=15))
    return {"Authorization": f"Bearer {token}"}


class TestProviderRoutes:
    def test_list_providers_user(self, client: TestClient, session):
        user = make_user(session, username="p_lister", email="p_lister@x.com")
        make_provider(session, display_name="Test Provider")
        
        resp = client.get("/api/v1/llms/providers", headers=auth_header(user.id))
        assert resp.status_code == 200
        assert resp.json()["total_items"] >= 1

    def test_get_provider_user(self, client: TestClient, session):
        user = make_user(session, username="p_getter", email="p_getter@x.com")
        provider = make_provider(session, display_name="My Provider")
        
        resp = client.get(f"/api/v1/llms/providers/{provider.id}", headers=auth_header(user.id))
        assert resp.status_code == 200
        assert resp.json()["display_name"] == "My Provider"

    def test_create_provider_admin(self, client: TestClient, session):
        admin = make_user(session, username="p_admin", email="p_admin@x.com", role=AuthRole.ADMIN)
        
        resp = client.post(
            "/api/v1/llms/providers",
            headers=auth_header(admin.id),
            json={
                "display_name": "New Provider",
                "provider_type": ProviderType.OPENAI.value,
                "api_key": "secret"
            }
        )
        assert resp.status_code == 201
        assert resp.json()["display_name"] == "New Provider"
        assert resp.json()["has_api_key"] is True

    def test_create_provider_user_rejected(self, client: TestClient, session):
        user = make_user(session, username="p_user", email="p_user@x.com")
        
        resp = client.post(
            "/api/v1/llms/providers",
            headers=auth_header(user.id),
            json={
                "display_name": "Denied",
                "provider_type": ProviderType.OPENAI.value
            }
        )
        assert resp.status_code == 403

    def test_update_provider_admin(self, client: TestClient, session):
        admin = make_user(session, username="p_admin_upd", email="p_admin_upd@x.com", role=AuthRole.ADMIN)
        provider = make_provider(session, display_name="Old Name")
        
        resp = client.put(
            f"/api/v1/llms/providers/{provider.id}",
            headers=auth_header(admin.id),
            json={"display_name": "New Name"}
        )
        assert resp.status_code == 200
        assert resp.json()["display_name"] == "New Name"

    def test_delete_provider_admin(self, client: TestClient, session):
        admin = make_user(session, username="p_admin_del", email="p_admin_del@x.com", role=AuthRole.ADMIN)
        provider = make_provider(session, display_name="ToDelete")
        
        resp = client.delete(
            f"/api/v1/llms/providers/{provider.id}",
            headers=auth_header(admin.id)
        )
        assert resp.status_code == 204


class TestProviderApiKeyRoutes:
    def test_get_api_key_admin(self, client: TestClient, session):
        admin = make_user(session, username="k_admin", email="k_admin@x.com", role=AuthRole.ADMIN)
        provider = make_provider(session, api_key="my_secret_key")
        
        resp = client.get(
            f"/api/v1/llms/providers/{provider.id}/api-key",
            headers=auth_header(admin.id)
        )
        assert resp.status_code == 200
        assert resp.json()["api_key"] == "my_secret_key"

    def test_update_api_key_admin(self, client: TestClient, session):
        admin = make_user(session, username="k_admin_upd", email="k_admin_upd@x.com", role=AuthRole.ADMIN)
        provider = make_provider(session, api_key="old")
        
        resp = client.put(
            f"/api/v1/llms/providers/{provider.id}/api-key",
            headers=auth_header(admin.id),
            json={"api_key": "new_key"}
        )
        assert resp.status_code == 204
        
        # Verify
        resp2 = client.get(
            f"/api/v1/llms/providers/{provider.id}/api-key",
            headers=auth_header(admin.id)
        )
        assert resp2.json()["api_key"] == "new_key"

    def test_api_key_user_rejected(self, client: TestClient, session):
        user = make_user(session, username="k_user", email="k_user@x.com")
        provider = make_provider(session, api_key="secret")
        
        resp = client.get(
            f"/api/v1/llms/providers/{provider.id}/api-key",
            headers=auth_header(user.id)
        )
        assert resp.status_code == 403


class TestLLMModelRoutes:
    def test_list_models_user(self, client: TestClient, session):
        user = make_user(session, username="m_lister", email="m_lister@x.com")
        provider = make_provider(session)
        make_llm_model(session, provider, display_name="Model X")
        
        resp = client.get("/api/v1/llms/models", headers=auth_header(user.id))
        assert resp.status_code == 200
        assert resp.json()["total_items"] >= 1

    def test_get_model_user(self, client: TestClient, session):
        user = make_user(session, username="m_getter", email="m_getter@x.com")
        provider = make_provider(session)
        model = make_llm_model(session, provider, display_name="Model Y")
        
        resp = client.get(f"/api/v1/llms/models/{model.id}", headers=auth_header(user.id))
        assert resp.status_code == 200
        assert resp.json()["display_name"] == "Model Y"

    def test_create_model_admin(self, client: TestClient, session):
        admin = make_user(session, username="m_admin", email="m_admin@x.com", role=AuthRole.ADMIN)
        provider = make_provider(session)
        
        resp = client.post(
            "/api/v1/llms/models",
            headers=auth_header(admin.id),
            json={
                "model_name": "gpt-5",
                "display_name": "GPT-5",
                "provider_id": provider.id
            }
        )
        assert resp.status_code == 201
        assert resp.json()["model_name"] == "gpt-5"

    def test_create_model_user_rejected(self, client: TestClient, session):
        user = make_user(session, username="m_user", email="m_user@x.com")
        provider = make_provider(session)
        
        resp = client.post(
            "/api/v1/llms/models",
            headers=auth_header(user.id),
            json={
                "model_name": "gpt-5",
                "display_name": "GPT-5",
                "provider_id": provider.id
            }
        )
        assert resp.status_code == 403

    def test_update_model_admin(self, client: TestClient, session):
        admin = make_user(session, username="m_admin_upd", email="m_admin_upd@x.com", role=AuthRole.ADMIN)
        provider = make_provider(session)
        model = make_llm_model(session, provider, display_name="Old")
        
        resp = client.put(
            f"/api/v1/llms/models/{model.id}",
            headers=auth_header(admin.id),
            json={"display_name": "New"}
        )
        assert resp.status_code == 200
        assert resp.json()["display_name"] == "New"

    def test_delete_model_admin(self, client: TestClient, session):
        admin = make_user(session, username="m_admin_del", email="m_admin_del@x.com", role=AuthRole.ADMIN)
        provider = make_provider(session)
        model = make_llm_model(session, provider, display_name="ToDelete")
        
        resp = client.delete(
            f"/api/v1/llms/models/{model.id}",
            headers=auth_header(admin.id)
        )
        assert resp.status_code == 204
