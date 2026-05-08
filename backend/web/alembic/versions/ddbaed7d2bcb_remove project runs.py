"""remove project runs

Revision ID: ddbaed7d2bcb
Revises: d5a129fa854c
Create Date: 2026-05-07 22:15:01.330973

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ddbaed7d2bcb'
down_revision: Union[str, Sequence[str], None] = 'd5a129fa854c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    with op.batch_alter_table('testsuite_run') as batch_op:
        batch_op.drop_column('project_run_id')

    op.drop_table('project_run')


def downgrade() -> None:
    """Downgrade schema."""
    op.create_table(
        'project_run',
        sa.Column('id', sa.INTEGER(), nullable=False),
        sa.Column('scope', sa.VARCHAR(length=9), nullable=False),
        sa.Column('created_at', sa.DATETIME(), nullable=False),
        sa.Column('started_at', sa.DATETIME(), nullable=True),
        sa.Column('finished_at', sa.DATETIME(), nullable=True),
        sa.Column('job_uid', sa.VARCHAR(), nullable=False),
        sa.Column('mode', sa.VARCHAR(length=10), nullable=False),
        sa.Column('status', sa.VARCHAR(length=7), nullable=False),
        sa.Column('project_id', sa.INTEGER(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['project.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_project_run_job_uid'), 'project_run', ['job_uid'], unique=True)

    with op.batch_alter_table('testsuite_run') as batch_op:
        batch_op.add_column(sa.Column('project_run_id', sa.INTEGER(), nullable=True))
        batch_op.create_foreign_key(
            'fk_testsuite_run_project_run_id', 'project_run', ['project_run_id'], ['id'], ondelete='CASCADE'
        )