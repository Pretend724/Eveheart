from __future__ import annotations

from array import array
from pathlib import Path
import sys
import unittest

from livekit import rtc
from livekit.agents import stt
from livekit.agents.voice import ModelSettings

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
for path in (ROOT, SRC):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

from local_asr import ASRResult
from my_agent import EveheartAgent


class _FakeLocalASR:
    def __init__(self, result: ASRResult | None) -> None:
        self._result = result
        self.calls: list[dict[str, int]] = []

    async def transcribe_bytes(
        self,
        audio_bytes: bytes,
        sample_rate: int,
        *,
        num_channels: int = 1,
    ) -> ASRResult | None:
        self.calls.append(
            {
                "audio_len": len(audio_bytes),
                "sample_rate": sample_rate,
                "num_channels": num_channels,
            }
        )
        return self._result


def _make_frame(samples: list[int], *, sample_rate: int = 16000) -> rtc.AudioFrame:
    frame = rtc.AudioFrame.create(
        sample_rate=sample_rate,
        num_channels=1,
        samples_per_channel=len(samples),
    )
    frame.data[:] = array("h", samples)
    return frame


class EveheartAgentSTTNodeTests(unittest.IsolatedAsyncioTestCase):
    async def test_stt_node_emits_final_transcript(self) -> None:
        fake_asr = _FakeLocalASR(
            ASRResult(text="ni hao, wo zai.", language="zh", confidence=0.91)
        )
        agent = EveheartAgent(local_asr=fake_asr)

        async def audio_stream():
            yield _make_frame([1, 2, 3, 4])
            yield _make_frame([5, 6, 7, 8])

        events_iter = await agent.stt_node(audio_stream(), ModelSettings())

        self.assertIsNotNone(events_iter)
        assert events_iter is not None
        events = [event async for event in events_iter]

        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].type, stt.SpeechEventType.FINAL_TRANSCRIPT)
        self.assertEqual(events[0].alternatives[0].text, "ni hao, wo zai.")
        self.assertAlmostEqual(events[0].alternatives[0].end_time, 0.0005)
        self.assertEqual(fake_asr.calls[0]["sample_rate"], 16000)
        self.assertEqual(fake_asr.calls[0]["num_channels"], 1)

    async def test_stt_node_returns_none_for_empty_result(self) -> None:
        fake_asr = _FakeLocalASR(None)
        agent = EveheartAgent(local_asr=fake_asr)

        async def audio_stream():
            yield _make_frame([1, 2, 3, 4])

        events_iter = await agent.stt_node(audio_stream(), ModelSettings())
        self.assertIsNone(events_iter)
