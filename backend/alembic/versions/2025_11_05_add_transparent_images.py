"""add_transparent_images

Revision ID: 2025_11_05_add_transparent_images
Revises: 2025_10_31_000007
Create Date: 2025-11-05
"""
from alembic import op
import sqlalchemy as sa

# revision identifiers
revision = '2025_11_05_add_transparent_images'
down_revision = '2025_10_31_000007'  # Последняя миграция: add_performance_indexes
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Добавляем новые поля для изображений с прозрачным фоном
    op.add_column('pets', sa.Column('image_egg_transparent_url', sa.String(), nullable=True))
    op.add_column('pets', sa.Column('image_baby_transparent_url', sa.String(), nullable=True))
    op.add_column('pets', sa.Column('image_adult_transparent_url', sa.String(), nullable=True))


def downgrade() -> None:
    # Удаляем поля при откате миграции
    op.drop_column('pets', 'image_adult_transparent_url')
    op.drop_column('pets', 'image_baby_transparent_url')
    op.drop_column('pets', 'image_egg_transparent_url')

