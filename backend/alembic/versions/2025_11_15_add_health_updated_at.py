"""add health_updated_at to pets

Revision ID: 2025_11_15_add_health_updated_at
Revises: 2025_11_15_add_pet_characteristics
Create Date: 2025-11-15
"""

from alembic import op
import sqlalchemy as sa
revision = "2025_11_15_add_health_updated_at"
down_revision = "2025_11_15_add_pet_characteristics"
branch_labels = None
depends_on = None


def upgrade() -> None:
    conn = op.get_bind()
    inspector = sa.inspect(conn)
    columns = {col["name"] for col in inspector.get_columns("pets")}

    if "health_updated_at" not in columns:
        op.add_column(
            "pets",
            sa.Column(
                "health_updated_at",
                sa.DateTime(timezone=True),
                nullable=True,
            ),
        )
    else:
        # Колонка уже существует (например, частичный прогон миграции) — используем её как есть
        pass

    conn.execute(
        sa.text(
            """
            UPDATE pets
            SET health_updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)
            WHERE health_updated_at IS NULL
            """
        )
    )


def downgrade() -> None:
    op.drop_column("pets", "health_updated_at")

