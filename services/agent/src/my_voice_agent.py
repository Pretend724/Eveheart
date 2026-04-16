from __future__ import annotations

import logging
from typing import AsyncIterable

from livekit import rtc
from livekit.agents import Agent, stt
from livekit.agents.voice import ModelSettings

from local_asr import LocalASR

logger = logging.getLogger(__name__)


class EveheartAgent(Agent):
    def __init__(self, local_asr: LocalASR) -> None:
        super().__init__(
            instructions=(
                "你是 Eveheart 的实时语音 AI 助手。"
                "回答要自然、简洁、友好。"
                "用户说中文时优先用中文回复。"
                "如果用户问题不明确，先简要澄清。"
            )
        )
        self._local_asr = local_asr

    async def on_enter(self) -> None:
        await self.session.generate_reply(
            instructions="先用中文简短问候用户，并说明你已经准备好开始语音交流。",
        )

    async def stt_node(
        self,
        audio: AsyncIterable[rtc.AudioFrame],
        model_settings: ModelSettings,
    ) -> AsyncIterable[stt.SpeechEvent] | None:
        del model_settings

        frames: list[rtc.AudioFrame] = []
        sample_rate: int | None = None
        num_channels: int | None = None
        total_samples_per_channel = 0

        async for frame in audio:
            frames.append(frame)
            total_samples_per_channel += frame.samples_per_channel
            if sample_rate is None:
                sample_rate = frame.sample_rate
                num_channels = frame.num_channels

        if not frames:
            logger.debug("Local ASR skipped because the current turn had no audio frames.")
            return None

        resolved_sample_rate = sample_rate or 16000
        resolved_channels = num_channels or 1
        duration_seconds = total_samples_per_channel / float(resolved_sample_rate)
        logger.info(
            (
                "Processing local ASR turn: frames=%s sample_rate=%s "
                "num_channels=%s duration=%.3fs"
            ),
            len(frames),
            resolved_sample_rate,
            resolved_channels,
            duration_seconds,
        )

        audio_bytes = b"".join(frame.data.cast("B").tobytes() for frame in frames)
        result = await self._local_asr.transcribe_bytes(
            audio_bytes=audio_bytes,
            sample_rate=resolved_sample_rate,
            num_channels=resolved_channels,
        )

        if result is None or not result.text.strip():
            logger.info("Local ASR produced no final transcript for this turn.")
            return None

        logger.info("Local ASR transcript: %s", result.text)

        async def _events() -> AsyncIterable[stt.SpeechEvent]:
            yield stt.SpeechEvent(
                type=stt.SpeechEventType.FINAL_TRANSCRIPT,
                alternatives=[
                    stt.SpeechData(
                        text=result.text,
                        language=result.language,
                        confidence=result.confidence,
                        start_time=0.0,
                        end_time=duration_seconds,
                    )
                ],
            )

        return _events()
