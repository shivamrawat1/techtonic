#!/bin/bash

# Set up error handling
set -e
set -o pipefail

echo "Setting up environment..."
export DJANGO_SETTINGS_MODULE=capstone_django.settings

echo "Running migrations..."
python manage.py migrate

# Check if data_dump.json exists and load data if it does
if [ -f "data_dump.json" ]; then
    echo "Loading data from data_dump.json..."
    python load_data.py
    if [ $? -ne 0 ]; then
        echo "Error loading data. Check data_migration.log for details."
    else
        echo "Data loaded successfully."
    fi
else
    echo "No data_dump.json found. Skipping data import."
fi

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting Gunicorn..."
gunicorn capstone_django.wsgi:application 