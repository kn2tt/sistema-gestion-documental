from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str

    FRONTEND_ORIGINS: str = (
        "http://127.0.0.1:5500,"
        "http://localhost:5500"
    )

    SESSION_COOKIE_NAME: str = "sgd_session"
    SESSION_TTL_HOURS: int = 8
    SESSION_COOKIE_SECURE: bool = False
    SESSION_COOKIE_SAMESITE: str = "lax"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()

engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
