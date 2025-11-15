"""add pet characteristics tables

Revision ID: 2025_11_15_add_pet_characteristics
Revises: 2025_11_05_add_transparent_images
Create Date: 2025-11-15
"""

from alembic import op
import sqlalchemy as sa

from config.pet_characteristics import PET_CHARACTERISTICS


revision = "2025_11_15_add_pet_characteristics"
down_revision = "2025_11_05_add_transparent_images"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "pet_characteristics",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pet_id", sa.Integer(), sa.ForeignKey("pets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("characteristic", sa.String(), nullable=False),
        sa.Column("value", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("status", sa.String(), nullable=False, server_default="normal"),
        sa.Column("metadata_json", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            onupdate=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("pet_id", "characteristic", name="uq_pet_characteristics_pet_id_characteristic"),
    )
    op.create_index("ix_pet_characteristics_pet_id", "pet_characteristics", ["pet_id"])

    op.create_table(
        "pet_characteristic_events",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("pet_id", sa.Integer(), sa.ForeignKey("pets.id", ondelete="CASCADE"), nullable=False),
        sa.Column("characteristic", sa.String(), nullable=False),
        sa.Column("value_before", sa.Integer(), nullable=True),
        sa.Column("value_after", sa.Integer(), nullable=True),
        sa.Column("delta", sa.Integer(), nullable=True),
        sa.Column("reason", sa.String(), nullable=True),
        sa.Column("source", sa.String(), nullable=True),
        sa.Column("payload", sa.JSON(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_pet_characteristic_events_pet_id", "pet_characteristic_events", ["pet_id"])

    _seed_characteristics()


def downgrade() -> None:
    op.drop_index("ix_pet_characteristic_events_pet_id", table_name="pet_characteristic_events")
    op.drop_table("pet_characteristic_events")
    op.drop_index("ix_pet_characteristics_pet_id", table_name="pet_characteristics")
    op.drop_table("pet_characteristics")


def _seed_characteristics() -> None:
    bind = op.get_bind()
    pets = list(bind.execute(sa.text("SELECT id, state FROM pets")))
    if not pets:
        return

    insert_stmt = sa.text(
        """
        INSERT INTO pet_characteristics (pet_id, characteristic, value, status, metadata_json)
        VALUES (:pet_id, :characteristic, :value, :status, :metadata_json)
        """
    )

    for pet_id, state in pets:
        definitions = PET_CHARACTERISTICS.get(state, {})
        for key, payload in definitions.items():
            normal = payload.get("normal", {})
            value = normal.get("max") or normal.get("min") or payload.get("range", {}).get("max") or 100

            bind.execute(
                insert_stmt,
                {
                    "pet_id": pet_id,
                    "characteristic": key,
                    "value": int(value),
                    "status": "normal",
                    "metadata_json": None,
                },
            )

