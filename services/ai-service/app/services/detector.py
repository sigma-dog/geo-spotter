import math
import os
from functools import lru_cache

import numpy as np
from ultralytics import YOLO

from app.services.pipeline_types import (
    DetectionCandidate,
    DetectionResult,
    TargetClass,
    TargetSpec,
)


DEFAULT_MODEL_NAME = os.getenv('YOLO_MODEL_NAME', 'yolo11n.pt')
DEFAULT_CONFIDENCE = float(os.getenv('YOLO_CONFIDENCE', '0.25'))
DEFAULT_IMAGE_SIZE = int(os.getenv('YOLO_IMAGE_SIZE', '640'))

CLASS_ALIASES: dict[TargetClass, set[str]] = {
    'bicycle': {'bicycle'},
    'bus': {'bus'},
    'car': {'car'},
    'motorcycle': {'motorcycle'},
    'truck': {'truck'},
    'van': {'car', 'truck', 'bus'},
}

TARGET_CLASS_PATTERNS: tuple[tuple[TargetClass, tuple[str, ...]], ...] = (
    ('bicycle', ('велосип', 'bicycle', 'bike')),
    ('bus', ('автобус', 'bus')),
    ('van', ('фургон', 'van')),
    ('truck', ('грузов', 'truck', 'lorry')),
    ('motorcycle', ('мото', 'motorcycle', 'motorbike')),
    ('car', ('машин', 'авто', 'car', 'vehicle')),
)

COLOR_PATTERNS: tuple[tuple[str, tuple[str, ...]], ...] = (
    ('yellow', ('желт', 'yellow')),
    ('red', ('красн', 'red')),
    ('blue', ('син', 'blue')),
    ('green', ('зелен', 'green')),
    ('black', ('черн', 'black')),
    ('white', ('бел', 'white')),
    ('gray', ('сер', 'grey', 'gray')),
    ('orange', ('оранж', 'orange')),
)


@lru_cache(maxsize=1)
def get_detection_model() -> YOLO:
    return YOLO(DEFAULT_MODEL_NAME)


def infer_target_spec(target: str) -> TargetSpec | None:
    normalized_target = target.lower()
    visible_attributes = _extract_visible_attributes(normalized_target)

    for class_name, patterns in TARGET_CLASS_PATTERNS:
        if any(pattern in normalized_target for pattern in patterns):
            return TargetSpec(
                class_name=class_name,
                raw_target=target,
                visible_attributes=visible_attributes,
            )

    return None


def _extract_visible_attributes(target: str) -> tuple[str, ...]:
    attributes: list[str] = []

    for normalized_name, patterns in COLOR_PATTERNS:
        if any(pattern in target for pattern in patterns):
            attributes.append(normalized_name)

    return tuple(attributes)


def detect_target_object(
    image_array: np.ndarray,
    target_spec: TargetSpec,
) -> DetectionResult:
    model = get_detection_model()
    results = model.predict(
        source=image_array,
        conf=DEFAULT_CONFIDENCE,
        imgsz=DEFAULT_IMAGE_SIZE,
        verbose=False,
    )

    candidates: list[DetectionCandidate] = []

    for result in results:
        names = result.names
        boxes = result.boxes

        for box in boxes:
            cls_id = int(box.cls.item())
            confidence = float(box.conf.item())
            x1, y1, x2, y2 = [int(value) for value in box.xyxy[0].tolist()]

            candidates.append(
                DetectionCandidate(
                    bbox=(x1, y1, x2, y2),
                    class_name=str(names[cls_id]),
                    confidence=confidence,
                )
            )

    aliases = CLASS_ALIASES[target_spec.class_name]
    matching_candidates = [
        candidate
        for candidate in candidates
        if candidate.class_name in aliases
    ]

    selected_candidate = (
        max(
            matching_candidates,
            key=lambda candidate: _detection_score(
                candidate,
                image_array.shape[1],
                image_array.shape[0],
            ),
        )
        if matching_candidates
        else None
    )

    return DetectionResult(
        all_candidates=candidates,
        selected_candidate=selected_candidate,
        target=target_spec,
    )


def _detection_score(
    detection: DetectionCandidate,
    image_width: int,
    image_height: int,
) -> float:
    x1, y1, x2, y2 = detection.bbox
    bbox_center_x = (x1 + x2) / 2
    bbox_center_y = (y1 + y2) / 2
    image_center_x = image_width / 2
    image_center_y = image_height / 2
    max_distance = math.hypot(image_center_x, image_center_y)
    center_distance = math.hypot(
        bbox_center_x - image_center_x,
        bbox_center_y - image_center_y,
    )
    center_score = 1 - min(1.0, center_distance / max(max_distance, 1.0))
    area_score = _bbox_area(detection.bbox) / max(image_width * image_height, 1)

    return detection.confidence * 1.0 + center_score * 0.6 + area_score * 0.2


def _bbox_area(bbox: tuple[int, int, int, int]) -> int:
    x1, y1, x2, y2 = bbox

    return max(0, x2 - x1) * max(0, y2 - y1)
