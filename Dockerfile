# Dockerfile (backend)
FROM python:3.12-slim

# system deps for psycopg2 and Pillow
RUN apt-get update && apt-get install -y build-essential libpq-dev gcc git --no-install-recommends && rm -rf /var/lib/apt/lists/*

# DODAJ OVDE - GDAL dependencies
RUN apt-get update && apt-get install -y \
    gdal-bin \
    libgdal-dev \
    python3-gdal \
    --no-install-recommends && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# kopiraj requirements pa instaliraj (layer caching)
COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip
RUN pip install -r /app/requirements.txt && pip install gunicorn

# kopiraj ceo projekt
COPY . /app

# entrypoint skripta
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

# Pokretanje kroz entrypoint (migracije, collectstatic, run)
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["gunicorn", "football.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--threads", "4"]