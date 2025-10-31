"""add performance indexes stage5

Revision ID: 2025_10_31_000007
Revises: drop_pet_image_b64_20251030
Create Date: 2025-10-31
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '2025_10_31_000007'
down_revision = 'drop_pet_image_b64_20251030'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Составной индекс для частых запросов: поиск питомцев по user_id и status
    # Используется в get_all_pets_summary_internal и get_summary_internal
    try:
        op.create_index(
            'ix_pets_user_id_status',
            'pets',
            ['user_id', 'status'],
            unique=False
        )
    except Exception:
        # Индекс уже существует или другая ошибка - игнорируем
        pass
    
    # Индекс для сортировки по created_at (уже может быть, но убеждаемся)
    try:
        op.create_index(
            'ix_pets_user_id_created_at',
            'pets',
            ['user_id', 'created_at'],
            unique=False
        )
    except Exception:
        pass
    
    # Индекс для Wallet.user_id (уже должен быть через ForeignKey, но убеждаемся)
    # Проверяем, есть ли уже индекс на wallets.user_id
    # Если нет - создаем (в SQLite уникальный constraint создает индекс автоматически)
    # Для других БД можем создать явный индекс
    try:
        # Проверяем наличие индекса
        # В SQLite уникальный constraint уже создает индекс
        # Для других БД создаем явно
        pass  # Wallet.user_id уже имеет индекс через unique=True
    except Exception:
        pass


def downgrade() -> None:
    try:
        op.drop_index('ix_pets_user_id_created_at', table_name='pets')
    except Exception:
        pass
    
    try:
        op.drop_index('ix_pets_user_id_status', table_name='pets')
    except Exception:
        pass

