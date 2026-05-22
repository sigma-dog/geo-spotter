from dataclasses import dataclass
from typing import Literal

import numpy as np


TargetClass = Literal['bicycle', 'bus', 'car', 'motorcycle', 'truck', 'van']
Verdict = Literal['match', 'no_match', 'uncertain']


@dataclass
class TargetSpec:
    class_name: TargetClass
    raw_target: str


@dataclass
class DetectionCandidate:
    bbox: tuple[int, int, int, int]
    class_name: str
    confidence: float


@dataclass
class DetectionResult:
    all_candidates: list[DetectionCandidate]
    selected_candidate: DetectionCandidate | None
    target: TargetSpec


@dataclass
class SegmentationResult:
    bbox: tuple[int, int, int, int]
    confidence: float
    mask: np.ndarray
    masked_crop: np.ndarray
    original_crop: np.ndarray
    source: Literal['segmentation', 'bbox-fallback']


@dataclass
class VlmVerificationResult:
    confidence: float
    matched: bool | None
    reason: str
    source: str


@dataclass
class RuleEngineResult:
    confidence: float
    reason: str
    verdict: Verdict
