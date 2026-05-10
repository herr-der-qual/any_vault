#!/bin/bash
cd /app

echo "Waiting for DB..."
python manage.py wait_for_db

echo "Resetting DB..."
python manage.py reset_db --no-input
python manage.py makemigrations products
python manage.py migrate
#python manage.py initialize

echo "Starting Django server..."
python manage.py runserver 0.0.0.0:8000