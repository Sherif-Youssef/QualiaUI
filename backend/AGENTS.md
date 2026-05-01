# Agent Code Style & Architectural Guidelines

This project follows a strict layered architecture and specific coding patterns to ensure consistency and maintainability.

## 1. Layered Architecture

Each module (e.g., `projects`, `testcases`, `runs`) should be organized into the following files:

- **`models.py`**: SQLModel database definitions.
- **`schemas.py`**: Pydantic models for API requests and responses. Use `ConfigDict(from_attributes=True)` for models that bridge from database objects.
- **`queries.py`**: Data access layer.
    - Use SQLModel `select` statements.
    - **Important**: Always use `col(Model.field)` when referencing columns in `where`, `order_by`, `join`, etc., to ensure type safety and compatibility.
    - Include `count` functions for pagination support.
- **`service.py`**: Business logic. Orchestrates calls to the query layer and handles data transformation between models and schemas.
- **`router.py`**: FastAPI route definitions. Use dependencies for auth and resource validation.
- **`dependencies.py`**: FastAPI dependencies. Use factory functions to create role-based resource loaders (e.g., `ViewerProjectDep`, `EditorTestCaseDep`).

## 2. Pagination Standard

- **Request**: Use `PaginationParams` as a dependency in the router.
- **Response**: Always return a `Page[T]` generic model from `src.base.schemas`.
- **Ordering**:
    - Default to `col(Model.id).asc()` if there exist no time field like created_at for example.

## 3. Resource Fetching & Permissions

- Perform existence checks (404) and permission checks (403) within dependencies.
- Use `check_project_role` from `src.projects.dependencies` to enforce RBAC.

## 4. SQLModel & SQLAlchemy Best Practices

- Use `session.flush()` to populate IDs before committing if you need the ID for subsequent operations (e.g., creating child records).
- Use `selectinload` or `subqueryload` for eager loading relationships to avoid N+1 problems.
- Prefer explicit mapping in service layers rather than returning database models directly when the schema differs significantly.

## 5. Naming Conventions

- Routers: `get_X_route`, `list_Xs_route`, `create_X_route`.
- Services: `get_X`, `list_Xs`, `create_X`.
- Queries: `get_by_id`, `get_all`, `count`.
