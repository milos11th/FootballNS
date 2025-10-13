#!/bin/bash
set -e

# čekaj na DB (jednostavan način)
# optional: možete dodati čekanje na host/db port ako želite robust solution
# izvrši migracije i collectstatic
echo "Running migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

# pokreni komandu koju je container dobio (npr. gunicorn)
exec "$@"
