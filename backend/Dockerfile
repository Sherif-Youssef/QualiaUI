FROM python:3.13.5-slim-bookworm AS base

ENV PYTHONDONTWRITEBYTECODE=1 
ENV PYTHONUNBUFFERED=1

RUN mkdir /app
WORKDIR /app

# RUN apt-get update && apt-get install -y --no-install-recommends \
#     libpq-dev gcc \
#     && rm -rf /var/lib/apt/lists/*

# install web requirements
COPY web/requirements.txt /app/web/requirements.txt
RUN pip install --upgrade pip \
    && pip install --no-cache-dir -r /app/web/requirements.txt

# install the automation_engine
COPY automation_engine /app/automation_engine
RUN pip install --no-cache-dir /app/automation_engine

COPY web /app/web

EXPOSE 8000

FROM base AS development

CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload", "--app-dir", "web"]
