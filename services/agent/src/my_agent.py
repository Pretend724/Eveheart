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
                "你是 Eveheart 的实时语音 AI 助手。"
                "回答要自然、简洁、友好。"
                "用户说中文时优先用中文回答。"
                "如果用户问题不明确，先简要澄清。"
            )
        )

    async def on_enter(self) -> None:
        await self.session.generate_reply(
            instructions="先用中文简短恶搞用户，并说明你已准备好语音交流。"
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