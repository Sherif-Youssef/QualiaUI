"""empty message

Revision ID: 0ca32a914bb4
Revises: d5a129fa854c
Create Date: 2026-05-08 02:23:36.800550

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "0ca32a914bb4"
down_revision: Union[str, Sequence[str], None] = "d5a129fa854c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    with op.batch_alter_table("testcase_run") as batch_op:
        batch_op.add_column(
            sa.Column(
                "name",
                sa.String(),
                nullable=False,
                server_default=""
            )
        )

    with op.batch_alter_table("testcase_run") as batch_op:
        batch_op.alter_column(
            "name",
            server_default=None
        )


def downgrade() -> None:
    """Downgrade schema."""

    with op.batch_alter_table("testcase_run") as batch_op:
        batch_op.drop_column("name")