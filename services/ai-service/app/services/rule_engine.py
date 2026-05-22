import os

from app.services.pipeline_types import (
    DetectionResult,
    RuleEngineResult,
    SegmentationResult,
    VlmVerificationResult,
)


DEFAULT_MATCH_CONFIDENCE = float(os.getenv('RULE_ENGINE_MATCH_CONFIDENCE', '0.6'))
DEFAULT_NO_MATCH_CONFIDENCE = float(os.getenv('RULE_ENGINE_NO_MATCH_CONFIDENCE', '0.6'))
DEFAULT_SEGMENTATION_MIN_COVERAGE = float(
    os.getenv('RULE_ENGINE_SEGMENTATION_MIN_COVERAGE', '0.02')
)


def evaluate_pipeline(
    detection: DetectionResult,
    segmentation: SegmentationResult | None,
    vlm_result: VlmVerificationResult | None,
) -> RuleEngineResult:
    if detection.selected_candidate is None:
        detected_classes = ', '.join(
            sorted({candidate.class_name for candidate in detection.all_candidates})
        ) or 'none'

        return RuleEngineResult(
            confidence=0.9,
            reason=(
                f'YOLO did not detect the expected object class "{detection.target.class_name}". '
                f'Detected classes: {detected_classes}.'
            ),
            verdict='no_match',
        )

    if segmentation is None:
        return RuleEngineResult(
            confidence=0.45,
            reason='Segmentation step did not produce an object mask.',
            verdict='uncertain',
        )

    mask_coverage = _mask_coverage(segmentation)
    if mask_coverage < DEFAULT_SEGMENTATION_MIN_COVERAGE:
        return RuleEngineResult(
            confidence=0.5,
            reason='Segmentation mask is too small for reliable verification.',
            verdict='uncertain',
        )

    if vlm_result is None:
        return RuleEngineResult(
            confidence=0.4,
            reason='VLM verification step did not return a result.',
            verdict='uncertain',
        )

    if vlm_result.matched is True and vlm_result.confidence >= DEFAULT_MATCH_CONFIDENCE:
        return RuleEngineResult(
            confidence=vlm_result.confidence,
            reason=(
                f'YOLO detected "{detection.selected_candidate.class_name}", '
                f'segmentation source: {segmentation.source}, '
                f'VLM confirmed the target. {vlm_result.reason}'
            ),
            verdict='match',
        )

    if vlm_result.matched is False and vlm_result.confidence >= DEFAULT_NO_MATCH_CONFIDENCE:
        return RuleEngineResult(
            confidence=vlm_result.confidence,
            reason=(
                f'YOLO detected "{detection.selected_candidate.class_name}", '
                f'but VLM rejected the target. {vlm_result.reason}'
            ),
            verdict='no_match',
        )

    return RuleEngineResult(
        confidence=max(0.35, vlm_result.confidence),
        reason=(
            f'Pipeline remained uncertain after detection and segmentation. '
            f'VLM result: {vlm_result.reason}'
        ),
        verdict='uncertain',
    )


def _mask_coverage(segmentation: SegmentationResult) -> float:
    if segmentation.mask.size == 0:
        return 0.0

    return float(segmentation.mask.mean())
