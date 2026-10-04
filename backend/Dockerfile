# syntax=docker/dockerfile:1

# ---------- builder: Python-Abhängigkeiten via uv ----------
FROM python:3.12-slim-bookworm AS builder
COPY --from=ghcr.io/astral-sh/uv:0.5 /uv /usr/local/bin/uv
ENV UV_COMPILE_BYTECODE=1 UV_LINK_MODE=copy UV_PYTHON_DOWNLOADS=never
WORKDIR /app
COPY pyproject.toml uv.lock* ./
RUN uv sync --locked --no-dev --no-install-project
COPY src ./src

# ---------- test: Lint + Tests (docker build --target test) ----------
FROM builder AS test
RUN uv sync --locked --no-install-project
COPY tests ./tests
RUN uv run ruff check src tests && uv run pytest -q

# ---------- runtime: imapsync + App ----------
FROM python:3.12-slim-bookworm AS runtime
ARG IMAPSYNC_URL=https://raw.githubusercontent.com/imapsync/imapsync/master/imapsync
RUN apt-get update && apt-get install -y --no-install-recommends \
        ca-certificates curl procps \
        libauthen-ntlm-perl libcgi-pm-perl libcrypt-openssl-rsa-perl libdata-uniqid-perl \
        libencode-imaputf7-perl libfile-copy-recursive-perl libfile-tail-perl \
        libio-socket-inet6-perl libio-socket-ssl-perl libio-tee-perl libhtml-parser-perl \
        libjson-webtoken-perl libmail-imapclient-perl libparse-recdescent-perl \
        libmodule-scandeps-perl libreadonly-perl libregexp-common-perl libsys-meminfo-perl \
        libterm-readkey-perl libunicode-string-perl liburi-perl libwww-perl \
        libproc-processtable-perl libdigest-hmac-perl \
    && curl -fsSL "$IMAPSYNC_URL" -o /usr/local/bin/imapsync \
    && chmod 755 /usr/local/bin/imapsync \
    && imapsync --version \
    && apt-get purge -y curl && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

RUN useradd --create-home --uid 10001 app && mkdir /data && chown app:app /data
WORKDIR /app
COPY --from=builder --chown=app:app /app /app
ENV PATH="/app/.venv/bin:$PATH" DATA_DIR=/data PYTHONUNBUFFERED=1
USER app
VOLUME ["/data"]
EXPOSE 8000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request,sys; urllib.request.urlopen('http://127.0.0.1:8000/api/health', timeout=3)" || exit 1
CMD ["uvicorn", "src.main:create_app", "--factory", "--host", "0.0.0.0", "--port", "8000"]
