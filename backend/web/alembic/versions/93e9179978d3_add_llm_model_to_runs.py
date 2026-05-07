"""add llm model to runs

Revision ID: 93e9179978d3
Revises: ddbaed7d2bcb
Create Date: 2026-05-07 22:38:42.685670

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '93e9179978d3'
down_revision: Union[str, Sequence[str], None] = 'ddbaed7d2bcb'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def is_sqlite():
    return op.get_bind().dialect.name == 'sqlite'


def upgrade() -> None:
    """Upgrade schema."""
    if is_sqlite():
        with op.batch_alter_table('testcase_run') as batch_op:
            batch_op.add_column(sa.Column('llm_model_id', sa.Integer(), nullable=True))
            batch_op.create_foreign_key('fk_testcase_run_llm_model_id', 'llm_model', ['llm_model_id'], ['id'], ondelete='SET NULL')

        with op.batch_alter_table('testsuite_run') as batch_op:
            batch_op.add_column(sa.Column('llm_model_id', sa.Integer(), nullable=True))
            batch_op.create_foreign_key('fk_testsuite_run_llm_model_id', 'llm_model', ['llm_model_id'], ['id'], ondelete='SET NULL')
    else:
        op.add_column('testcase_run', sa.Column('llm_model_id', sa.Integer(), nullable=True))
        op.create_foreign_key(None, 'testcase_run', 'llm_model', ['llm_model_id'], ['id'], ondelete='SET NULL')
        op.add_column('testsuite_run', sa.Column('llm_model_id', sa.Integer(), nullable=True))
        op.create_foreign_key(None, 'testsuite_run', 'llm_model', ['llm_model_id'], ['id'], ondelete='SET NULL')


def downgrade() -> None:
    """Downgrade schema."""
    if is_sqlite():
        with op.batch_alter_table('testsuite_run') as batch_op:
            batch_op.drop_constraint('fk_testsuite_run_llm_model_id', type_='foreignkey')
            batch_op.drop_column('llm_model_id')

        with op.batch_alter_table('testcase_run') as batch_op:
            batch_op.drop_constraint('fk_testcase_run_llm_model_id', type_='foreignkey')
            batch_op.drop_column('llm_model_id')
    else:
        op.drop_constraint(None, 'testsuite_run', type_='foreignkey')
        op.drop_column('testsuite_run', 'llm_model_id')
        op.drop_constraint(None, 'testcase_run', type_='foreignkey')
        op.drop_column('testcase_run', 'llm_model_id')
