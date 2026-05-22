import base64
import io
import os

import numpy as np
from PIL import Image

from app.schemas.verification import VerificationRequest, VerificationResponse
from app.services.detector import detect_target_object, infer_target_spec
from app.services.rule_engine import evaluate_pipeline
from app.services.segmenter import segment_detected_object
from app.services.vlm import get_vlm_verifier


DEFAULT_MIN_CROP_SIDE_PX = int(os.getenv('YOLO_MIN_CROP_SIDE_PX', '48'))
DEFAULT_MIN_UPSCALED_SIDE_PX = int(os.getenv('YOLO_MIN_UPSCALED_SIDE_PX', '512'))


def verify_selection(payload: VerificationRequest) -> VerificationResponse:
    image = decode_image(payload.image.crop_base64)

    if min(image.width, image.height) < DEFAULT_MIN_CROP_SIDE_PX:
        return VerificationResponse(
            confidence=0.72,
            debug={
                'crop_size': {
                    'height': image.height,
                    'width': image.width,
                },
                'stage': 'input_validation',
            },
            reason='Selected crop is too small in absolute pixels for reliable detection.',
            source='ai',
            verdict='uncertain',
        )

    prepared_image = prepare_detection_image(image)
    image_array = np.array(prepared_image)
    target_spec = infer_target_spec(payload.task.target)

    if target_spec is None:
        return VerificationResponse(
            confidence=0.42,
            debug={
                'raw_target': payload.task.target,
                'stage': 'target_mapping',
            },
            reason='Task target is not mapped to the current detector class set yet.',
            source='ai',
            verdict='uncertain',
        )

    detection_result = detect_target_object(image_array, target_spec)
    segmentation_result = (
        segment_detected_object(image_array, detection_result.selected_candidate)
        if detection_result.selected_candidate is not None
        else None
    )

    vlm_result = None
    if segmentation_result is not None:
        vlm_result = get_vlm_verifier().verify(
            target_spec,
            segmentation_result,
        )

    rule_result = evaluate_pipeline(
        detection_result,
        segmentation_result,
        vlm_result,
    )
    debug = build_pipeline_debug(
        target_spec,
        detection_result,
        segmentation_result,
        vlm_result,
        rule_result,
        image,
        prepared_image,
    )

    return VerificationResponse(
        confidence=round(min(0.99, max(0.0, rule_result.confidence)), 2),
        debug=debug,
        reason=rule_result.reason,
        source='ai',
        verdict=rule_result.verdict,
    )


def decode_image(crop_base64: str) -> Image.Image:
    image_bytes = base64.b64decode(crop_base64)
    image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

    return image


def prepare_detection_image(image: Image.Image) -> Image.Image:
    width, height = image.size
    shortest_side = min(width, height)

    if shortest_side >= DEFAULT_MIN_UPSCALED_SIDE_PX:
        return image

    scale = DEFAULT_MIN_UPSCALED_SIDE_PX / max(shortest_side, 1)
    resized_width = max(1, round(width * scale))
    resized_height = max(1, round(height * scale))

    return image.resize((resized_width, resized_height), Image.Resampling.LANCZOS)


def build_pipeline_debug(
    target_spec,
    detection_result,
    segmentation_result,
    vlm_result,
    rule_result,
    input_image: Image.Image,
    prepared_image: Image.Image,
) -> dict[str, object]:
    return {
        'input_image_size': {
            'height': input_image.height,
            'width': input_image.width,
        },
        'prepared_image_size': {
            'height': prepared_image.height,
            'width': prepared_image.width,
        },
        'target': {
            'class_name': target_spec.class_name,
            'raw_target': target_spec.raw_target,
        },
        'detector': {
            'all_candidates': [
                {
                    'bbox': list(candidate.bbox),
                    'class_name': candidate.class_name,
                    'confidence': candidate.confidence,
                }
                for candidate in detection_result.all_candidates
            ],
            'selected_candidate': (
                {
                    'bbox': list(detection_result.selected_candidate.bbox),
                    'class_name': detection_result.selected_candidate.class_name,
                    'confidence': detection_result.selected_candidate.confidence,
                }
                if detection_result.selected_candidate is not None
                else None
            ),
        },
        'segmenter': (
            {
                'bbox': list(segmentation_result.bbox),
                'confidence': segmentation_result.confidence,
                'mask_coverage': (
                    float(segmentation_result.mask.mean())
                    if segmentation_result.mask.size > 0
                    else 0.0
                ),
                'mask_shape': list(segmentation_result.mask.shape),
                'masked_crop_shape': list(segmentation_result.masked_crop.shape),
                'original_crop_shape': list(segmentation_result.original_crop.shape),
                'source': segmentation_result.source,
            }
            if segmentation_result is not None
            else None
        ),
        'vlm': (
            {
                'confidence': vlm_result.confidence,
                'matched': vlm_result.matched,
                'reason': vlm_result.reason,
                'source': vlm_result.source,
            }
            if vlm_result is not None
            else None
        ),
        'rule_engine': {
            'confidence': rule_result.confidence,
            'reason': rule_result.reason,
            'verdict': rule_result.verdict,
        },
    }
