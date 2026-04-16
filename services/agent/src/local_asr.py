from __future__ import annotations

import asyncio
import logging
import re
import sys
from dataclasses import dataclass
from math import isfinite
from pathlib import Path
from typing import Any, Callable

import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from load_model import load_voice_model

logger = logging.getLogger(__name__)

_TAG_PATTERN = re.compile(r"<\|([^|]+)\|>")
_LANGUAGE_TAGS = {
    "zh": "zh",
    "yue": "zh",
    "en": "en",
    "ja": "ja",
    "ko": "ko",
}


@dataclass(slots=True)
class ASRResult:
    text: str
    language: str = "zh"
    confidence: float = 1.0


class LocalASR:
    def __init__(
        self,
        *,
        model_loader: Callable[[], Any] = load_voice_model,
        target_sample_rate: int = 16000,
        language: str = "zh",
        use_itn: bool = False,
        leading_silence_ms: int = 80,
        trailing_silence_ms: int = 320,
    ) -> None:
        self._target_sample_rate = target_sample_rate
        self._language = language
        self._use_itn = use_itn
        self._leading_silence_ms = leading_silence_ms
        self._trailing_silence_ms = trailing_silence_ms
        self._model = model_loader()
        logger.info(
            (
                "LocalASR initialized with target_sample_rate=%s "
                "language=%s leading_silence_ms=%s trailing_silence_ms=%s"
            ),
            self._target_sample_rate,
            self._language,
            self._leading_silence_ms,
            self._trailing_silence_ms,
        )

    async def transcribe_bytes(
        self,
        audio_bytes: bytes,
        sample_rate: int,
        *,
        num_channels: int = 1,
    ) -> ASRResult | None:
        return await asyncio.to_thread(
            self._transcribe_sync,
            audio_bytes,
            sample_rate,
            num_channels,
        )

    def _transcribe_sync(
        self,
        audio_bytes: bytes,
        sample_rate: int,
        num_channels: int,
    ) -> ASRResult | None:
        if not audio_bytes:
            return None

        audio = self._pcm16_bytes_to_float32(audio_bytes, num_channels)
        if audio.size == 0:
            return None

        if sample_rate != self._target_sample_rate:
            audio = self._resample(audio, sample_rate, self._target_sample_rate)

        audio = self._pad_with_silence(audio)
        audio = np.ascontiguousarray(audio, dtype=np.float32)
        duration_seconds = audio.shape[0] / float(self._target_sample_rate)
        logger.info(
            "LocalASR transcribing turn: samples=%s duration=%.3fs sample_rate=%s",
            audio.shape[0],
            duration_seconds,
            self._target_sample_rate,
        )

        result = self._model.generate(
            input=audio,
            cache={},
            language=self._language,
            use_itn=self._use_itn,
        )
        return self._parse_result(result)

    def _pcm16_bytes_to_float32(
        self,
        audio_bytes: bytes,
        num_channels: int,
    ) -> np.ndarray:
        if num_channels <= 0:
            raise ValueError("num_channels must be positive")

        pcm = np.frombuffer(audio_bytes, dtype=np.int16)
        if pcm.size == 0:
            return np.empty(0, dtype=np.float32)

        if num_channels > 1:
            usable_samples = pcm.size - (pcm.size % num_channels)
            pcm = pcm[:usable_samples]
            if pcm.size == 0:
                return np.empty(0, dtype=np.float32)
            pcm = pcm.reshape(-1, num_channels).mean(axis=1)

        return pcm.astype(np.float32) / 32768.0

    def _resample(
        self,
        audio: np.ndarray,
        sample_rate: int,
        target_sample_rate: int,
    ) -> np.ndarray:
        if sample_rate <= 0:
            raise ValueError("sample_rate must be positive")

        if audio.size == 0 or sample_rate == target_sample_rate:
            return audio.astype(np.float32, copy=False)

        target_length = max(
            1,
            int(round(audio.shape[0] * target_sample_rate / sample_rate)),
        )
        source_positions = np.arange(audio.shape[0], dtype=np.float64)
        target_positions = np.linspace(
            0,
            audio.shape[0] - 1,
            num=target_length,
            dtype=np.float64,
        )
        return np.interp(target_positions, source_positions, audio).astype(
            np.float32,
        )

    def _pad_with_silence(self, audio: np.ndarray) -> np.ndarray:
        if audio.size == 0:
            return audio.astype(np.float32, copy=False)

        leading = self._silence_array(self._leading_silence_ms)
        trailing = self._silence_array(self._trailing_silence_ms)
        if leading.size == 0 and trailing.size == 0:
            return audio.astype(np.float32, copy=False)

        return np.concatenate((leading, audio, trailing)).astype(np.float32, copy=False)

    def _silence_array(self, duration_ms: int) -> np.ndarray:
        if duration_ms <= 0:
            return np.empty(0, dtype=np.float32)

        samples = max(
            0,
            int(round(self._target_sample_rate * (duration_ms / 1000.0))),
        )
        return np.zeros(samples, dtype=np.float32)

    def _parse_result(self, result: Any) -> ASRResult | None:
        if isinstance(result, list):
            payload = result[0] if result else {}
        elif isinstance(result, dict):
            payload = result
        else:
            payload = {}

        raw_text = str(payload.get("text") or "").strip()
        logger.info("LocalASR raw transcript: %s", raw_text or "<empty>")
        cleaned_text = self._clean_transcript(raw_text)
        if not cleaned_text:
            logger.info("LocalASR cleaned transcript is empty after normalization.")
            return None

        confidence = payload.get("confidence")
        parsed_confidence = 1.0
        if confidence is not None:
            try:
                confidence_value = float(confidence)
            except (TypeError, ValueError):
                confidence_value = 1.0
            if isfinite(confidence_value):
                parsed_confidence = confidence_value
        return ASRResult(
            text=cleaned_text,
            language=self._extract_language(raw_text),
            confidence=parsed_confidence,
        )

    def _extract_language(self, raw_text: str) -> str:
        for tag in _TAG_PATTERN.findall(raw_text):
            if tag in _LANGUAGE_TAGS:
                return _LANGUAGE_TAGS[tag]
        return "zh"

    def _clean_transcript(self, raw_text: str) -> str:
        cleaned = _TAG_PATTERN.sub(" ", raw_text)
        cleaned = " ".join(cleaned.split()).strip()
        return cleaned or ""
