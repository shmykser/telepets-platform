from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker
from models import Base
from config.settings import DATABASE_URL
import ssl
import certifi
from urllib.parse import urlparse

# Преобразуем синхронные URL в асинхронные драйверы при необходимости
if DATABASE_URL.startswith("sqlite://"):
    async_database_url = DATABASE_URL.replace("sqlite://", "sqlite+aiosqlite://")
elif DATABASE_URL.startswith("postgresql://"):
    async_database_url = DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
else:
    async_database_url = DATABASE_URL

# Аргументы подключения (SSL включаем только для внешних URL)
connect_args: dict = {}
if async_database_url.startswith("postgresql+asyncpg://"):
    parsed = urlparse(async_database_url)
    hostname = parsed.hostname or ""
    is_external_host = "." in hostname  # внутренние хосты Render вида 'dpg-xxxxx' без точки
    if is_external_host:
        # Для Supabase pooler: отключаем проверку сертификата
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        ssl_context.check_hostname = False
        ssl_context.verify_mode = ssl.CERT_NONE
        connect_args = {"ssl": ssl_context}

engine = create_async_engine(
    async_database_url,
    echo=True,
    future=True,
    connect_args=connect_args,
)

AsyncSessionLocal = sessionmaker(
    bind=engine, class_=AsyncSession, expire_on_commit=False
)

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Для SQLite добавим недостающие колонки image_*_url (быстрая стартовая миграция)
        if async_database_url.startswith("sqlite+"):
            try:
                def _ensure_cols(sync_conn):
                    cols = sync_conn.exec_driver_sql("PRAGMA table_info(pets)").fetchall()
                    names = {c[1] for c in cols}
                    ddl = []
                    if 'image_egg_url' not in names:
                        ddl.append("ALTER TABLE pets ADD COLUMN image_egg_url VARCHAR")
                    if 'image_baby_url' not in names:
                        ddl.append("ALTER TABLE pets ADD COLUMN image_baby_url VARCHAR")
                    if 'image_adult_url' not in names:
                        ddl.append("ALTER TABLE pets ADD COLUMN image_adult_url VARCHAR")
                    # Удаляем legacy base64-колонки, если существуют (SQLite не умеет DROP COLUMN до 3.35 — пробуем, иначе игнор)
                    drop_candidates = ['image_egg_b64','image_baby_b64','image_adult_b64']
                    for col in drop_candidates:
                        if col in names:
                            try:
                                sync_conn.exec_driver_sql(f"ALTER TABLE pets DROP COLUMN {col}")
                            except Exception:
                                pass
                    for stmt in ddl:
                        sync_conn.exec_driver_sql(stmt)
                await conn.run_sync(_ensure_cols)
            except Exception:
                pass

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

__all__ = ['engine', 'AsyncSessionLocal', 'init_db', 'get_db']

