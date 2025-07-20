# Stage 1: Build the application
FROM python:3.12-slim AS build

# Set working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Stage 2: Run the application
FROM python:3.12-slim

WORKDIR /app

# Copy installed packages and executables from build stage
COPY --from=build /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=build /usr/local/bin /usr/local/bin

# Copy application code
COPY . .

# Expose the port the app runs on
EXPOSE 8083

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    FLASK_APP=app.py

# Command to run the application
CMD ["gunicorn", "--bind", "0.0.0.0:8083", "wsgi:application", "--worker-class", "uvicorn.workers.UvicornWorker"]
