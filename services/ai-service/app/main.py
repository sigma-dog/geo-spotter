from pathlib import Path

from fastapi import FastAPI
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / '.env')

from app.api.routes import router


app = FastAPI(
    title='Geo Spotter AI Service',
    version='0.1.0',
)

app.include_router(router)
