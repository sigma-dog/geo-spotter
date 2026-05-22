from typing import Any, Literal

from pydantic import BaseModel, Field


Verdict = Literal['match', 'no_match', 'uncertain']


class HealthResponse(BaseModel):
    status: Literal['ok']


class VerificationTask(BaseModel):
    id: str
    title: str
    target: str


class VerificationImage(BaseModel):
    crop_base64: str = Field(alias='cropBase64')
    crop_height_px: int = Field(alias='cropHeightPx')
    crop_mime_type: Literal['image/png'] = Field(alias='cropMimeType')
    crop_width_px: int = Field(alias='cropWidthPx')
    source_image_height: int = Field(alias='sourceImageHeight')
    source_image_url: str = Field(alias='sourceImageUrl')
    source_image_width: int = Field(alias='sourceImageWidth')

    model_config = {
        'populate_by_name': True,
    }


class VerificationRequest(BaseModel):
    attempt_id: str = Field(alias='attemptId')
    image: VerificationImage
    task: VerificationTask

    model_config = {
        'populate_by_name': True,
    }


class VerificationResponse(BaseModel):
    confidence: float
    debug: dict[str, Any] | None = None
    reason: str
    source: Literal['mock', 'ai']
    verdict: Verdict
