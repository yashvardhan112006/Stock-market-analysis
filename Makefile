.PHONY: help install dev backend frontend test clean build

PYTHON := python3
PIP := $(PYTHON) -m pip

help:
	@echo "Available commands:"
	@echo "  make install   - Install all backend and frontend dependencies"
	@echo "  make dev       - Run backend and frontend concurrently"
	@echo "  make backend   - Run FastAPI server"
	@echo "  make frontend  - Run Vite dev server"
	@echo "  make test      - Run backend unit tests"
	@echo "  make build     - Build frontend production assets"
	@echo "  make clean     - Remove cache, dist, and pycache artifacts"

install:
	$(PIP) install -r backend/requirements.txt
	cd frontend && npm install

dev:
	./start.sh

backend:
	$(PYTHON) -m uvicorn backend.main:app --reload --port 8000

frontend:
	cd frontend && npm run dev

test:
	$(PYTHON) -m pytest backend/tests/ -v

build:
	cd frontend && npm run build

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	find . -type d -name ".pytest_cache" -exec rm -rf {} +
	rm -rf frontend/dist
