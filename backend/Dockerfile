FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# Run as a normal user, not root, so a compromised app can't change the container.
RUN useradd --create-home --uid 10001 appuser
WORKDIR /app

# Dependencies first: Docker reuses this layer until requirements.txt changes.
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app ./app

USER appuser
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)"

# One worker on purpose: the cache, rate limiter and daily budget live in process memory.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]