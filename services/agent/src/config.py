from __future__ import annotations

import os
from dataclasses import dataclass


@dataclass
class Settings:
    livekit_url: str
    livekit_api_key: str
    livekit_api_secret: str
    agent_name: str
    openai_api_key: str | None = None
    local_asr_url: str | None = None
    local_avatar_url: str | None = None


def get_settings() -> Settings:
    return Settings(
        livekit_url=os.environ["LIVEKIT_URL"],
        livekit_api_key=os.environ["LIVEKIT_API_KEY"],
        livekit_api_secret=os.environ["LIVEKIT_API_SECRET"],
        agent_name=os.getenv("AGENT_NAME", "eveheart-agent"),
        openai_api_key=os.getenv("OPENAI_API_KEY"),
        local_asr_url=os.getenv("LOCAL_ASR_URL"),
        local_avatar_url=os.getenv("LOCAL_AVATAR_URL"),
    )