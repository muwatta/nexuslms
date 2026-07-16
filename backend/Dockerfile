FROM python:3.12-slim

WORKDIR /app
COPY . .

RUN pip install --no-cache-dir -r requirements.txt

ENV DJANGO_SETTINGS_MODULE=nexuslms.settings.prod

ENTRYPOINT ["sh", "-c", "python manage.py migrate && daphne -b 0.0.0.0 -p 8000 nexuslms.asgi:application"]
