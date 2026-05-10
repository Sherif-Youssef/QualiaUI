"""add usevideo/screenshots to testcaserun

Revision ID: 1cc035b65e85
Revises: a7cdbb939af3
Create Date: 2026-05-10 02:00:28.891486

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = '1cc035b65e85'
down_revision: Union[str, Sequence[str], None] = 'a7cdbb939af3'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def is_sqlite():
    return op.get_bind().dialect.name == 'sqlite'


def upgrade() -> None:
    """Upgrade schema."""
    if is_sqlite():
        with op.batch_alter_table('testcase_run') as batch_op:
            batch_op.add_column(sa.Column('use_screenshots', sa.Boolean(), nullable=False, server_default=sa.false()))
            batch_op.add_column(sa.Column('use_video', sa.Boolean(), nullable=False, server_default=sa.false()))
            batch_op.add_column(sa.Column('termination_screenshot', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
            batch_op.add_column(sa.Column('video_url', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
            batch_op.add_column(sa.Column('video_upload_task_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True))

        with op.batch_alter_table('testsuite_run') as batch_op:
            batch_op.add_column(sa.Column('use_screenshots', sa.Boolean(), nullable=False, server_default=sa.false()))
            batch_op.add_column(sa.Column('use_video', sa.Boolean(), nullable=False, server_default=sa.false()))
    else:
        op.add_column('testcase_run', sa.Column('use_screenshots', sa.Boolean(), nullable=False, server_default=sa.false()))
        op.add_column('testcase_run', sa.Column('use_video', sa.Boolean(), nullable=False, server_default=sa.false()))
        op.add_column('testcase_run', sa.Column('termination_screenshot', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        op.add_column('testcase_run', sa.Column('video_url', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        op.add_column('testcase_run', sa.Column('video_upload_task_id', sqlmodel.sql.sqltypes.AutoString(), nullable=True))
        op.add_column('testsuite_run', sa.Column('use_screenshots', sa.Boolean(), nullable=False, server_default=sa.false()))
        op.add_column('testsuite_run', sa.Column('use_video', sa.Boolean(), nullable=False, server_default=sa.false()))


def downgrade() -> None:
    """Downgrade schema."""
    if is_sqlite():
        with op.batch_alter_table('testsuite_run') as batch_op:
            batch_op.drop_column('use_video')
            batch_op.drop_column('use_screenshots')

        with op.batch_alter_table('testcase_run') as batch_op:
            batch_op.drop_column('video_upload_task_id')
            batch_op.drop_column('video_url')
            batch_op.drop_column('termination_screenshot')
            batch_op.drop_column('use_video')
            batch_op.drop_column('use_screenshots')
    else:
        op.drop_column('testsuite_run', 'use_video')
        op.drop_column('testsuite_run', 'use_screenshots')
        op.drop_column('testcase_run', 'video_upload_task_id')
        op.drop_column('testcase_run', 'video_url')
        op.drop_column('testcase_run', 'termination_screenshot')
        op.drop_column('testcase_run', 'use_video')
        op.drop_column('testcase_run', 'use_screenshots')
