# ---- Stage 1: build the React frontend ----
FROM node:20-slim AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: FastAPI serving API + built frontend ----
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend/ backend/
COPY data/ data/
COPY --from=frontend /app/frontend/dist frontend/dist

WORKDIR /app/backend
ENV PORT=8080
CMD exec uvicorn server:app --host 0.0.0.0 --port ${PORT}
