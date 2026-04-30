FROM python:3.13.5-slim-bookworm AS base

ENV PYTHONDONTWRITEBYTECODE=1 
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# RUN apt-get update && apt-get install -y --no-install-recommends \
#     libpq-dev gcc \
#     && rm -rf /var/lib/apt/lists/*

# install web requirements only
COPY web/requirements.txt /app/web/requirements.txt
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r /app/web/requirements.txt

COPY web /app/web

WORKDIR /app/web

EXPOSE 8000

FROM base AS development

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
