import base64
import io
import json
import os
from functools import lru_cache

import numpy as np
from PIL import Image

from app.services.pipeline_types import SegmentationResult, TargetSpec, VlmVerificationResult


DEFAULT_VLM_PROVIDER = os.getenv('VLM_PROVIDER', 'mock')
DEFAULT_OPENAI_MODEL = os.getenv('OPENAI_VLM_MODEL', 'gpt-4.1-mini')
DEFAULT_OPENAI_BASE_URL = os.getenv('OPENAI_BASE_URL')
DEFAULT_LM_STUDIO_BASE_URL = os.getenv('LM_STUDIO_BASE_URL', 'http://127.0.0.1:1234/v1')
DEFAULT_LM_STUDIO_MODEL = os.getenv('LM_STUDIO_MODEL', 'local-model')


class BaseVlmVerifier:
    def verify(
        self,
        target: TargetSpec,
        segmentation: SegmentationResult,
    ) -> VlmVerificationResult:
        raise NotImplementedError


class MockVlmVerifier(BaseVlmVerifier):
    def verify(
        self,
        target: TargetSpec,
        segmentation: SegmentationResult,
    ) -> VlmVerificationResult:
        return VlmVerificationResult(
            confidence=0.34,
            matched=None,
            reason=(
                'VLM provider is not configured yet. '
                'Detection and segmentation passed, but attribute verification is unavailable.'
            ),
            source='mock-vlm',
        )


class OpenAIVlmVerifier(BaseVlmVerifier):
    def __init__(self, *, api_key: str, model: str, base_url: str | None = None) -> None:
        from openai import OpenAI

        client_kwargs: dict[str, str] = {
            'api_key': api_key,
        }
        if base_url:
            client_kwargs['base_url'] = base_url

        self._client = OpenAI(**client_kwargs)
        self._model = model

    def verify(
        self,
        target: TargetSpec,
        segmentation: SegmentationResult,
    ) -> VlmVerificationResult:
        prompt = (
            'You verify whether a segmented object matches a game target.\n'
            f'Target object class: {target.class_name}\n'
            f'Raw task target: {target.raw_target}\n'
            'You will receive two images:\n'
            '1. The original selected crop.\n'
            '2. The segmented object crop with background removed.\n'
            'Decide whether the segmented object matches the target, including color and other visible attributes.\n'
            'Respond with JSON only in this shape:\n'
            '{"matched": true|false|null, "confidence": 0.0, "reason": "short explanation"}'
        )

        original_image = _encode_array_as_data_url(segmentation.original_crop)
        masked_image = _encode_array_as_data_url(segmentation.masked_crop)
        response = self._client.responses.create(
            model=self._model,
            input=[
                {
                    'role': 'user',
                    'content': [
                        {'type': 'input_text', 'text': prompt},
                        {'type': 'input_image', 'image_url': original_image},
                        {'type': 'input_image', 'image_url': masked_image},
                    ],
                }
            ],
        )
        parsed = _parse_vlm_json_response(response.output_text)

        return VlmVerificationResult(
            confidence=float(parsed.get('confidence', 0.0)),
            matched=parsed.get('matched'),
            reason=str(parsed.get('reason', 'VLM did not provide a reason.')),
            source=f'openai:{self._model}',
        )


@lru_cache(maxsize=1)
def get_vlm_verifier() -> BaseVlmVerifier:
    provider = DEFAULT_VLM_PROVIDER.lower()

    if provider == 'openai':
        try:
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise RuntimeError('OPENAI_API_KEY is not configured.')

            return OpenAIVlmVerifier(
                api_key=api_key,
                model=DEFAULT_OPENAI_MODEL,
                base_url=DEFAULT_OPENAI_BASE_URL,
            )
        except Exception:
            return MockVlmVerifier()

    if provider == 'lm_studio':
        try:
            return OpenAIVlmVerifier(
                api_key='lm-studio',
                model=DEFAULT_LM_STUDIO_MODEL,
                base_url=DEFAULT_LM_STUDIO_BASE_URL,
            )
        except Exception:
            return MockVlmVerifier()

    return MockVlmVerifier()


def _encode_array_as_data_url(image_array: np.ndarray) -> str:
    image = Image.fromarray(image_array.astype(np.uint8), mode='RGB')
    buffer = io.BytesIO()
    image.save(buffer, format='PNG')
    encoded = base64.b64encode(buffer.getvalue()).decode('utf-8')

    return f'data:image/png;base64,{encoded}'


def _parse_vlm_json_response(output_text: str) -> dict[str, object]:
    if not output_text:
        return {
            'confidence': 0.0,
            'matched': None,
            'reason': 'VLM returned an empty response.',
        }

    candidate_text = output_text.strip()

    if candidate_text.startswith('```'):
        candidate_text = candidate_text.strip('`')
        if candidate_text.startswith('json'):
            candidate_text = candidate_text[4:].strip()

    try:
        parsed = json.loads(candidate_text)
    except json.JSONDecodeError:
        return {
            'confidence': 0.0,
            'matched': None,
            'reason': f'Unable to parse VLM response as JSON: {output_text}',
        }

    if not isinstance(parsed, dict):
        return {
            'confidence': 0.0,
            'matched': None,
            'reason': f'Unexpected VLM response format: {output_text}',
        }

    return parsed
