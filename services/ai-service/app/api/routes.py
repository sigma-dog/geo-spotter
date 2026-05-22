from fastapi import APIRouter

from app.schemas.verification import (
    HealthResponse,
    VerificationRequest,
    VerificationResponse,
)
from app.services.verifier import verify_selection


router = APIRouter()


@router.get('/health', response_model=HealthResponse)
def healthcheck() -> HealthResponse:
    return HealthResponse(status='ok')


@router.post('/verify-selection', response_model=VerificationResponse)
def verify_selection_endpoint(
    payload: VerificationRequest,
) -> VerificationResponse:
    return verify_selection(payload)
