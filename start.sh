#!/bin/bash

# Exit on any error
set -e

echo "Starting Techtonic application..."

# Set environment variables
export DJANGO_SETTINGS_MODULE=capstone_django.settings

# Wait for database to be ready (if needed)
echo "Waiting for database connection..."
python manage.py check --database default

# Run migrations
echo "Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Start the application
echo "Starting Gunicorn server..."
exec gunicorn \
    --bind 0.0.0.0:8080 \
    --workers 3 \
    --timeout 120 \
    --keep-alive 2 \
    --max-requests 1000 \
    --max-requests-jitter 100 \
    --access-logfile - \
    --error-logfile - \
    capstone_django.wsgi:application
