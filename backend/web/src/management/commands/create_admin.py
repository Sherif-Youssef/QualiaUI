import click
from fastapi import HTTPException
from sqlmodel import Session

from src.auth.models import Role
from src.auth.schemas import UserCreate
from src.auth.service import create_user
from src.database import engine


@click.command(name="create_admin")
@click.option("--first-name", prompt=True, help="Admin first name")
@click.option("--last-name", prompt=True, help="Admin last name")
@click.option("--username", prompt=True, help="Admin username")
@click.option("--email", prompt=True, help="Admin email")
@click.option(
    "--password",
    prompt=True,
    hide_input=True,
    confirmation_prompt=True,
    help="Admin password",
)
def command(first_name: str, last_name: str, username: str, email: str, password: str) -> None:
    try:
        with Session(engine) as session:
            user = create_user(
                session=session,
                user_create=UserCreate(
                    first_name=first_name,
                    last_name=last_name,
                    username=username,
                    email=email,
                    role=Role.ADMIN,
                    is_active=True,
                ),
                password=password,
                is_temp_pass=False,
            )

        click.echo(
            f"Admin account created: id={user.id}, username={user.username}, email={user.email}"
        )
    except HTTPException as exc:
        raise click.ClickException(str(exc.detail)) from exc
