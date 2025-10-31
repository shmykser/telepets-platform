# syntax=docker/dockerfile:1

# ----- Builder -----
FROM python:3.12-slim AS builder
WORKDIR /app

# System deps for building wheels (psycopg2, Pillow)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    g++ \
    libpq-dev \
    libjpeg62-turbo-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip wheel && \
    pip wheel --no-cache-dir --wheel-dir /wheels -r requirements.txt

# ----- Runtime -----
FROM python:3.12-slim AS runtime
WORKDIR /app

# Runtime deps (curl for healthcheck)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    libjpeg62-turbo \
    zlib1g \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=builder /wheels /wheels
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir --no-index --find-links=/wheels /wheels/*

# Copy application code
COPY . .

# Проверка наличия важных файлов (ПЕРЕД созданием пользователя, чтобы видеть ошибки)
RUN echo "=== Checking cache directory ===" && \
    ls -la /app/cache/ 2>&1 || echo "WARNING: cache directory not found" && \
    echo "=== Checking redis_client.py ===" && \
    ls -la /app/cache/redis_client.py 2>&1 || echo "WARNING: redis_client.py not found" && \
    echo "=== Checking __init__.py ===" && \
    ls -la /app/cache/__init__.py 2>&1 || echo "WARNING: __init__.py not found" && \
    echo "=== Testing Python import ===" && \
    python -c "import cache; print('cache module found')" 2>&1 || echo "WARNING: cannot import cache module"

# Non-root user
RUN useradd --create-home --shell /bin/bash app && chown -R app:app /app
USER app

# Expose (documentation only); runtime uses env PORT
EXPOSE 10000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:${PORT:-10000}/monitoring/health || exit 1

# Command
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}
