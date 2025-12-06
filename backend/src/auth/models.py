from sqlmodel import Field, SQLModel

class User(SQLModel, table=True):
    id: int | None = Field(default=None, primary_key=True)
    first_name: str
    last_name: str
    username: str
    email: str
    hashed_password: str
    is_active: bool = Field(default=True)
    is_admin: bool = Field(default=False)
    