FROM python:3.9-slim

WORKDIR /app

RUN apt-get update && \
    apt-get install -y libgl1 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

COPY . .

WORKDIR /app/backend

EXPOSE 5000

CMD ["python", "app.py"]
