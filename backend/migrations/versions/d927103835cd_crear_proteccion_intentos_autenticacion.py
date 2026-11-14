"""crear proteccion intentos autenticacion

Revision ID: d927103835cd
Revises: 9d4c2a7b1e60
Create Date: 2026-11-14 17:59:58.742257

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'd927103835cd'
down_revision: Union[str, Sequence[str], None] = '9d4c2a7b1e60'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'auth_protection_states',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('identifier_type', sa.String(length=20), nullable=False),
        sa.Column('identifier_hash', sa.String(length=64), nullable=False),
        sa.Column('failure_count', sa.Integer(), nullable=False),
        sa.Column('window_started_at', sa.DateTime(), nullable=True),
        sa.Column('lock_level', sa.Integer(), nullable=False),
        sa.Column('locked_until', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint(
            "identifier_type IN ('account', 'ip')",
            name='ck_auth_protection_identifier_type'
        ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'identifier_type',
            'identifier_hash',
            name='uq_auth_protection_identifier'
        )
    )

    op.create_index(
        op.f('ix_auth_protection_states_identifier_type'),
        'auth_protection_states',
        ['identifier_type'],
        unique=False
    )


def downgrade() -> None:
    op.drop_index(
        op.f('ix_auth_protection_states_identifier_type'),
        table_name='auth_protection_states'
    )

    op.drop_table('auth_protection_states')
    # ### end Alembic commands ###
