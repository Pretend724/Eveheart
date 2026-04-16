from __future__ import annotations

from pathlib import Path
import sys
import unittest

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "src"
for path in (ROOT, SRC):
    if str(path) not in sys.path:
        sys.path.insert(0, str(path))

from local_asr import LocalASR


class _FakeModel:
    def __init__(self, text: str) -> None:
        self._text = text
        self.last_input = None
        self.last_kwargs = None

    def generate(self, *, input, **kwargs):
        self.last_input = input
        self.last_kwargs = kwargs
        return [{"text": self._text}]


class LocalASRTests(unittest.IsolatedAsyncioTestCase):
    async def test_transcribe_bytes_cleans_tags_and_pads_audio(self) -> None:
        fake_model = _FakeModel("<|zh|><|NEUTRAL|>ni hao Eveheart")
        asr = LocalASR(
            model_loader=lambda: fake_model,
            target_sample_rate=16000,
            leading_silence_ms=100,
            trailing_silence_ms=200,
        )

        audio_bytes = (b"\x00\x00\x10\x00\xf0\xff\x00\x00") * 8
        result = await asr.transcribe_bytes(
            audio_bytes,
            sample_rate=16000,
            num_channels=1,
        )

        self.assertIsNotNone(result)
        assert result is not None
        self.assertEqual(result.text, "ni hao Eveheart")
        self.assertEqual(result.language, "zh")
        self.assertEqual(fake_model.last_input.dtype.name, "float32")
        self.assertEqual(fake_model.last_kwargs["language"], "zh")
        self.assertEqual(fake_model.last_input.shape[0], 4832)

    async def test_transcribe_bytes_returns_none_for_nospeech(self) -> None:
        fake_model = _FakeModel("<|nospeech|><|EMO_UNKNOWN|><|Event_UNK|><|woitn|>")
        asr = LocalASR(model_loader=lambda: fake_model)

        result = await asr.transcribe_bytes(
            b"\x00\x00\x00\x00" * 4,
            sample_rate=16000,
            num_channels=1,
        )

        self.assertIsNone(result)
