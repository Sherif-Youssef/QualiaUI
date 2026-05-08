"""empty message

Revision ID: 5d76d0a2eb75
Revises: 0ca32a914bb4
Create Date: 2026-05-08 03:21:15.083279

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5d76d0a2eb75"
down_revision: Union[str, Sequence[str], None] = "0ca32a914bb4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    with op.batch_alter_table("testsuite_run") as batch_op:
        batch_op.add_column(
            sa.Column(
                "name",
                sa.String(),
                nullable=False,
                server_default=""
            )
        )

    # Optional cleanup:
    # remove the default after populating existing rows
    with op.batch_alter_table("testsuite_run") as batch_op:
        batch_op.alter_column(
            "name",
            server_default=None
        )


def downgrade() -> None:
    """Downgrade schema."""

    with op.batch_alter_table("testsuite_run") as batch_op:
        batch_op.drop_column("name")