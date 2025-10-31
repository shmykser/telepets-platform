"""add image url columns to pets

Revision ID: add_pet_image_urls_20251030
Revises: 2025_08_21_000004_add_user_anonymity
Create Date: 2025-10-30
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_pet_image_urls_20251030'
down_revision = '2025_08_21_000004_add_user_anonymity'
branch_labels = None
depends_on = None


def upgrade() -> None:
    with op.batch_alter_table('pets') as batch:
        batch.add_column(sa.Column('image_egg_url', sa.String(), nullable=True))
        batch.add_column(sa.Column('image_baby_url', sa.String(), nullable=True))
        batch.add_column(sa.Column('image_adult_url', sa.String(), nullable=True))


def downgrade() -> None:
    with op.batch_alter_table('pets') as batch:
        batch.drop_column('image_adult_url')
        batch.drop_column('image_baby_url')
        batch.drop_column('image_egg_url')


