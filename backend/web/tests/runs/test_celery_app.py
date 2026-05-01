from src.runs.celery_app import import_all_models

def test_import_all_models():
    # Should not raise any ImportError
    import_all_models()
