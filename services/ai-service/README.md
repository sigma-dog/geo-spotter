# AI Service

Minimal FastAPI service for object verification in game selections.

## Run locally

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

## Endpoints

- `GET /health`
- `POST /verify-selection`

## YOLO setup

By default the service uses `yolo11n.pt` via Ultralytics and downloads the weights on first run.

Optional environment variables:

- `YOLO_MODEL_NAME`
- `YOLO_CONFIDENCE`
- `YOLO_IMAGE_SIZE`

The current verifier uses:

- YOLO detection for object class matching
- simple HSV-based color analysis on the best matching detection box

This is a practical MVP for tasks like `Желтая машина`, `Красный автобус`, `Велосипед`.
