from __future__ import annotations

from typing import AsyncIterable, Optional

from livekit import rtc
from livekit.agents import Agent
from livekit.agents.voice import ModelSettings
from livekit.agents import stt


class EveheartAgent(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=(
                "你是沐心,温柔的AI情感陪伴助手。"
                "专注倾听、共情、安抚、情绪舒缓与心理陪伴。"
                "语气温暖、简洁、治愈，全程中文。"
                "不诊断、不治疗，只做安全陪伴。"
                "回答简短流畅，适合语音播报。"
                "保持尊重、保密、温暖、无评判。"
            )
        )

    async def on_enter(self) -> None:
        await self.session.generate_reply(
            instructions="用温柔、简短、自然的中文问候用户，告诉用户你已准备好倾听与陪伴。"
        )
    async def stt_node(
        self,
        audio: AsyncIterable[rtc.AudioFrame],
        model_settings: ModelSettings,
    ) -> Optional[AsyncIterable[stt.SpeechEvent]]:
        # 这里后面替换成你的本地 ASR 逻辑
        # 当前阶段先走默认实现，确保系统先通
        events = Agent.default.stt_node(self, audio, model_settings)
        return events