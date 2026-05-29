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
- `VLM_MAX_IMAGE_SIDE_PX`
- `VLM_JPEG_QUALITY`
- `VLM_INCLUDE_ORIGINAL_CROP`

The current verifier uses:

- YOLO detection for object class matching
- optional visible-attribute verification in VLM only when the raw task target explicitly contains those attributes
- resized/compressed VLM image payloads for smaller local context windows

This is a practical MVP for tasks like `Желтая машина`, `Красный автобус`, `Велосипед`.
