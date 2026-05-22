import os
from functools import lru_cache

import numpy as np
from ultralytics import YOLO

from app.services.pipeline_types import DetectionCandidate, SegmentationResult


DEFAULT_SEG_MODEL_NAME = os.getenv('YOLO_SEG_MODEL_NAME', 'yolo11n-seg.pt')
DEFAULT_SEG_CONFIDENCE = float(
    os.getenv('YOLO_SEG_CONFIDENCE', os.getenv('YOLO_CONFIDENCE', '0.25'))
)
DEFAULT_SEG_IMAGE_SIZE = int(
    os.getenv('YOLO_SEG_IMAGE_SIZE', os.getenv('YOLO_IMAGE_SIZE', '640'))
)


@lru_cache(maxsize=1)
def get_segmentation_model() -> YOLO:
    return YOLO(DEFAULT_SEG_MODEL_NAME)


def segment_detected_object(
    image_array: np.ndarray,
    detection: DetectionCandidate,
) -> SegmentationResult:
    try:
        return _segment_with_model(image_array, detection)
    except Exception:
        return _segment_with_bbox_fallback(image_array, detection)


def _segment_with_model(
    image_array: np.ndarray,
    detection: DetectionCandidate,
) -> SegmentationResult:
    model = get_segmentation_model()
    results = model.predict(
        source=image_array,
        conf=DEFAULT_SEG_CONFIDENCE,
        imgsz=DEFAULT_SEG_IMAGE_SIZE,
        verbose=False,
    )

    best_match: tuple[float, np.ndarray, tuple[int, int, int, int], float] | None = None

    for result in results:
        if result.masks is None or result.boxes is None:
            continue

        masks = result.masks.data.cpu().numpy()
        boxes = result.boxes

        for index, box in enumerate(boxes):
            x1, y1, x2, y2 = [int(value) for value in box.xyxy[0].tolist()]
            confidence = float(box.conf.item())
            bbox = (x1, y1, x2, y2)
            score = _bbox_iou(detection.bbox, bbox)

            if best_match is None or score > best_match[0]:
                best_match = (score, masks[index], bbox, confidence)

    if best_match is None or best_match[0] <= 0:
        return _segment_with_bbox_fallback(image_array, detection)

    _, raw_mask, bbox, confidence = best_match
    resized_mask = _resize_mask_to_image(raw_mask, image_array.shape[1], image_array.shape[0])
    boolean_mask = resized_mask >= 0.5

    return _build_segmentation_result(
        image_array,
        bbox,
        boolean_mask,
        confidence,
        'segmentation',
    )


def _segment_with_bbox_fallback(
    image_array: np.ndarray,
    detection: DetectionCandidate,
) -> SegmentationResult:
    x1, y1, x2, y2 = detection.bbox
    mask = np.zeros(image_array.shape[:2], dtype=bool)
    mask[max(0, y1):max(0, y2), max(0, x1):max(0, x2)] = True

    return _build_segmentation_result(
        image_array,
        detection.bbox,
        mask,
        detection.confidence,
        'bbox-fallback',
    )


def _build_segmentation_result(
    image_array: np.ndarray,
    bbox: tuple[int, int, int, int],
    mask: np.ndarray,
    confidence: float,
    source: str,
) -> SegmentationResult:
    x1, y1, x2, y2 = _clip_bbox(bbox, image_array.shape[1], image_array.shape[0])
    cropped_mask = mask[y1:y2, x1:x2]
    original_crop = image_array[y1:y2, x1:x2]
    masked_crop = np.zeros_like(original_crop)

    if cropped_mask.size > 0:
        masked_crop[cropped_mask] = original_crop[cropped_mask]

    return SegmentationResult(
        bbox=(x1, y1, x2, y2),
        confidence=confidence,
        mask=cropped_mask,
        masked_crop=masked_crop,
        original_crop=original_crop,
        source=source,
    )


def _clip_bbox(
    bbox: tuple[int, int, int, int],
    width: int,
    height: int,
) -> tuple[int, int, int, int]:
    x1, y1, x2, y2 = bbox
    left = max(0, min(x1, width - 1))
    top = max(0, min(y1, height - 1))
    right = max(left + 1, min(x2, width))
    bottom = max(top + 1, min(y2, height))

    return left, top, right, bottom


def _bbox_iou(
    first: tuple[int, int, int, int],
    second: tuple[int, int, int, int],
) -> float:
    ax1, ay1, ax2, ay2 = first
    bx1, by1, bx2, by2 = second

    inter_left = max(ax1, bx1)
    inter_top = max(ay1, by1)
    inter_right = min(ax2, bx2)
    inter_bottom = min(ay2, by2)

    inter_width = max(0, inter_right - inter_left)
    inter_height = max(0, inter_bottom - inter_top)
    intersection = inter_width * inter_height

    if intersection == 0:
        return 0.0

    first_area = max(0, ax2 - ax1) * max(0, ay2 - ay1)
    second_area = max(0, bx2 - bx1) * max(0, by2 - by1)
    union = max(first_area + second_area - intersection, 1)

    return intersection / union


def _resize_mask_to_image(
    mask: np.ndarray,
    width: int,
    height: int,
) -> np.ndarray:
    if mask.shape == (height, width):
        return mask

    from PIL import Image

    image = Image.fromarray((mask * 255).astype(np.uint8), mode='L')
    resized = image.resize((width, height), Image.Resampling.BILINEAR)

    return np.asarray(resized, dtype=np.float32) / 255.0
