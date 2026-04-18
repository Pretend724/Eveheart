from __future__ import annotations

import asyncio
import json
import logging

from dotenv import load_dotenv
from livekit import agents, rtc
from livekit.agents import (
    AgentServer,
    AgentSession,
    TurnHandlingOptions,
    inference,
    room_io,
)
from livekit.plugins import anam, noise_cancellation, silero, keyframe
from livekit.plugins.turn_detector.multilingual import MultilingualModel

from my_agent import EveheartAgent

load_dotenv(".env")

logger = logging.getLogger(__name__)

server = AgentServer()


def prewarm(proc: agents.JobProcess) -> None:
    proc.userdata["vad"] = silero.VAD.load()


server.setup_fnc = prewarm


@server.rtc_session(agent_name="eveheart-agent")
async def entrypoint(ctx: agents.JobContext) -> None:

    session = AgentSession(
        stt=inference.STT(model="deepgram/nova-2", language="zh"),
        llm=inference.LLM(model="openai/gpt-5.2-chat-latest"),
        tts=inference.TTS(
            model="cartesia/sonic-3",
            voice="a167e0f3-df7e-4d52-a9c3-f949145efdab", #man
            # voice="6eb8965c-e295-47bd-a9e4-3eeebb3abcff", #woman
            language="zh",
        ),
        vad=ctx.proc.userdata["vad"],
        turn_handling=TurnHandlingOptions(
            turn_detection=MultilingualModel(),
        ),
    )

    # --- Avatar state ---
    _avatar_lock = asyncio.Lock()
    _avatar_started = False

    async def _start_avatar() -> None:
        nonlocal _avatar_started
        async with _avatar_lock:
            if _avatar_started:
                return
            try:
                # avatar = anam.AvatarSession(
                #     persona_config=anam.PersonaConfig(
                #         name="Hunter",
                #         avatarId="ecfb2ddb-80ec-4526-88a7-299a4738957c",
                #     ),
                # )
                avatar = keyframe.AvatarSession(
                    persona_id="81b834ee-8aaa-4796-861e-5b206f6e1bff", #male
                    # persona_id="fbf30421-c647-49f8-8440-b748c01201fe", #famale
                )
                await avatar.start(session, room=ctx.room)
                _avatar_started = True
                logger.info("Anam avatar session started successfully.")
            except Exception as exc:
                if "api key" in str(exc).lower() or "configuration" in str(exc).lower():
                    logger.error(
                        "Anam avatar could not start: missing API key or configuration. "
                        "Set ANAM_API_KEY in your environment. (%s)",
                        exc,
                    )
                else:
                    logger.error("Anam avatar failed to start: %s", exc)

    # --- Data channel listener ---
    def on_data_received(packet: rtc.DataPacket) -> None:
        try:
            payload = json.loads(packet.data.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            return

        if payload.get("type") == "enable_avatar":
            logger.info(
                "Received enable_avatar request from frontend, scheduling avatar start."
            )
            asyncio.get_event_loop().create_task(_start_avatar())

    ctx.room.on("data_received", on_data_received)

    # --- Start agent session ---
    await session.start(
        room=ctx.room,
        agent=EveheartAgent(),
        room_options=room_io.RoomOptions(
            audio_input=room_io.AudioInputOptions(
                noise_cancellation=lambda params: (
                    noise_cancellation.BVCTelephony()
                    if params.participant.kind
                    == rtc.ParticipantKind.PARTICIPANT_KIND_SIP
                    else None
                ),
            ),
        ),
    )


if __name__ == "__main__":
    agents.cli.run_app(server)
