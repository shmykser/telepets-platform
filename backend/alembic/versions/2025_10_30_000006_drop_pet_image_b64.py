"""drop base64 columns from pets

Revision ID: drop_pet_image_b64_20251030
Revises: add_pet_image_urls_20251030
Create Date: 2025-10-30
"""

from alembic import op
import sqlalchemy as sa


revision = 'drop_pet_image_b64_20251030'
down_revision = 'add_pet_image_urls_20251030'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('pets') as batch:
        with op.get_context().autocommit_block():
            pass
        try:
            batch.drop_column('image_egg_b64')
        except Exception:
            pass
        try:
            batch.drop_column('image_baby_b64')
        except Exception:
            pass
        try:
            batch.drop_column('image_adult_b64')
        except Exception:
            pass


def downgrade() -> None:
    with op.batch_alter_table('pets') as batch:
        batch.add_column(sa.Column('image_egg_b64', sa.Text(), nullable=True))
        batch.add_column(sa.Column('image_baby_b64', sa.Text(), nullable=True))
        batch.add_column(sa.Column('image_adult_b64', sa.Text(), nullable=True))


