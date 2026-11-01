from logging.config import fileConfig

from sqlalchemy import engine_from_config
from sqlalchemy import pool

from alembic import context

from app.core.database import settings, Base
import app.models

# Configuración de Alembic
config = context.config

# Configuración de logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata de los modelos SQLAlchemy
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Ejecuta las migraciones en modo offline."""

    url = settings.DATABASE_URL

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Ejecuta las migraciones en modo online."""

    configuration = config.get_section(config.config_ini_section)

    configuration["sqlalchemy.url"] = settings.DATABASE_URL

    connectable = engine_from_config(
        configuration,
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()