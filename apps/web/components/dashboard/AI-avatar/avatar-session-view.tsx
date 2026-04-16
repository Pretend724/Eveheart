'use client';

import React, { useEffect, useState } from 'react';
import {
  useAgent,
  useLocalParticipant,
  useSessionContext,
  useSessionMessages,
  useRoomContext,
  useVoiceAssistant,
  VideoTrack,
  type TrackReference,
} from '@livekit/components-react';
import { Track } from 'livekit-client';
import { AnimatePresence, motion } from 'motion/react';
import { useTheme } from 'next-themes';
import { BotIcon, CameraIcon, Loader2Icon, MessageSquareTextIcon, XIcon } from 'lucide-react';
import type { AppConfig } from '@/app-config';
import { AgentChatTranscript } from '@/components/agents-ui/agent-chat-transcript';
import { AgentControlBar } from '@/components/agents-ui/agent-control-bar';
import { AudioVisualizer } from '@/components/agents-ui/blocks/agent-session-view-01/components/audio-visualizer';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Agent state badge
// ---------------------------------------------------------------------------

const AGENT_STATE_LABELS: Record<string, string | undefined> = {
  connecting: '连接中',
  initializing: '初始化中',
  listening: '正在聆听',
  thinking: '思考中',
  speaking: '正在回复',
};

const AGENT_STATE_COLOR_CLASSES: Record<string, string | undefined> = {
  connecting: 'bg-background/50 text-muted-foreground border border-border/40',
  initializing: 'bg-background/50 text-muted-foreground border border-border/40',
  listening:
    'bg-green-500/15 text-green-700 border border-green-500/25 dark:text-green-400 dark:bg-green-500/10',
  thinking:
    'bg-amber-500/15 text-amber-700 border border-amber-500/25 dark:text-amber-400 dark:bg-amber-500/10',
  speaking:
    'bg-blue-500/15 text-blue-700 border border-blue-500/25 dark:text-blue-400 dark:bg-blue-500/10',
};

interface AgentStateBadgeProps {
  state: string;
}

/**
 * Animated pill badge showing the current agent state.
 * Returns null when the state has no label (e.g. 'disconnected').
 */
function AgentStateBadge({ state }: AgentStateBadgeProps) {
  const label = AGENT_STATE_LABELS[state];
  if (!label) return null;

  const colorClass =
    AGENT_STATE_COLOR_CLASSES[state] ??
    'bg-background/50 text-muted-foreground border border-border/40';

  return (
    <motion.span
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: 'easeOut' as const }}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1',
        'text-xs font-semibold shadow-sm backdrop-blur-sm',
        colorClass,
      )}
    >
      <span className="size-1.5 animate-pulse rounded-full bg-current" />
      {label}
    </motion.span>
  );
}

// ---------------------------------------------------------------------------
// Transcript empty state
// ---------------------------------------------------------------------------

function TranscriptEmptyState() {
  return (
    <div className="flex h-full items-center justify-center px-4 py-8">
      <p className="text-center text-xs leading-5 text-muted-foreground">
        开始说话后，
        <br />
        对话内容将实时显示在这里
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export interface AvatarSessionViewProps extends React.ComponentProps<'section'> {
  /** App-level configuration forwarded from the server component. */
  appConfig: AppConfig;
}

/**
 * Immersive full-screen avatar session view.
 *
 * Layout:
 * ┌─────────────────────────────────┬──────────┐
 * │                                 │  Chat    │
 * │  Full-screen Audio Visualizer   │  Panel   │
 * │  or Avatar Video                │  (25 %)  │
 * │                                 │  float   │
 * │         [State Badge]           │  right   │
 * ├─────────────────────────────────┴──────────┤
 * │             Control Bar                    │
 * └────────────────────────────────────────────┘
 *
 * The transcript panel floats over the right 25 % of the visualizer area
 * using a semi-transparent frosted-glass background. It can be toggled
 * open/closed via the header × button (or the chat icon when hidden).
 *
 * The component accepts a forwarded `ref` so it can be wrapped with
 * `motion.create()` in the parent `ViewController`.
 */
export function AvatarSessionView({
  appConfig,
  className,
  ref,
  ...props
}: AvatarSessionViewProps) {
  // Chat panel open/closed — visible by default.
  const [chatOpen, setChatOpen] = useState(true);
  // Tracks whether an avatar-enable request has been sent to the agent.
  const [avatarRequested, setAvatarRequested] = useState(false);

  const room = useRoomContext();
  const session = useSessionContext();
  const { messages } = useSessionMessages(session);
  const { state: agentState } = useAgent();
  const { localParticipant } = useLocalParticipant();
  const { videoTrack: agentVideoTrack } = useVoiceAssistant();
  const { resolvedTheme } = useTheme();

  const isAvatar = agentVideoTrack !== undefined;
  const videoWidth = agentVideoTrack?.publication.dimensions?.width ?? 0;
  const videoHeight = agentVideoTrack?.publication.dimensions?.height ?? 0;
  const avatarAspectRatio =
    videoWidth > 0 && videoHeight > 0 ? `${videoWidth} / ${videoHeight}` : '9 / 16';
  const localCameraPublication = localParticipant.getTrackPublication(Track.Source.Camera);
  const localCameraTrack: TrackReference | undefined =
    localCameraPublication && !localCameraPublication.isMuted
      ? {
          participant: localParticipant,
          publication: localCameraPublication,
          source: Track.Source.Camera,
        }
      : undefined;
  const localCameraWidth = localCameraTrack?.publication.dimensions?.width ?? 0;
  const localCameraHeight = localCameraTrack?.publication.dimensions?.height ?? 0;

  // Reset the pending state once the avatar track actually appears.
  useEffect(() => {
    if (isAvatar) setAvatarRequested(false);
  }, [isAvatar]);

  // Sends a data message to the agent requesting avatar activation.
  const handleEnableAvatar = async () => {
    if (isAvatar || avatarRequested) return;
    setAvatarRequested(true);
    const payload = new TextEncoder().encode(
      JSON.stringify({ type: 'enable_avatar' }),
    );
    try {
      await room.localParticipant.publishData(payload, { reliable: true });
    } catch (err) {
      console.error('Failed to send enable_avatar message:', err);
      setAvatarRequested(false);
    }
  };

  // Honour the configured accent colour for the current theme.
  const visualizerColor =
    resolvedTheme === 'dark'
      ? appConfig.audioVisualizerColorDark
      : appConfig.audioVisualizerColor;

  // Show transcript content area when there are messages or agent is thinking.
  const hasTranscriptContent = messages.length > 0 || agentState === 'thinking';

  return (
    <section
      ref={ref}
      className={cn(
        'bg-background fixed inset-0 z-50 flex flex-col overflow-hidden',
        className,
      )}
      {...props}
    >
      {/* ────────────────────────────────────────────────────────────────────
          1. MAIN AREA
             Full-screen visualizer/video is the canvas. The chat panel and
             state badge are absolute children layered on top of it.
          ──────────────────────────────────────────────────────────────────── */}
      <div className="relative min-h-0 flex-1 overflow-hidden">

        {/* ── Full-screen visualizer / avatar video ── */}
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {isAvatar ? (
              /* Agent published a video track → render it full-bleed */
              <motion.div
                key="avatar-video"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' as const }}
                className="absolute inset-0 flex items-center justify-center px-6 py-8 md:px-10 md:py-10"
              >
                <div
                  className={cn(
                    'relative flex w-full items-center justify-center overflow-hidden',
                    'max-h-[min(74vh,56rem)] max-w-[min(68vw,34rem)]',
                    'rounded-[2rem] border border-border/40',
                    'bg-gradient-to-b from-background/95 via-background/80 to-background/65',
                    'shadow-[0_24px_80px_rgba(15,23,42,0.18)] backdrop-blur-md',
                    'dark:shadow-[0_24px_90px_rgba(0,0,0,0.4)]',
                    chatOpen && 'md:max-w-[min(54vw,30rem)]',
                  )}
                  style={{ aspectRatio: avatarAspectRatio }}
                >
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_48%)] dark:bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_48%)]" />
                  <VideoTrack
                    trackRef={agentVideoTrack}
                    width={videoWidth}
                    height={videoHeight}
                    className="relative z-10 h-full w-full object-contain"
                  />
                </div>
              </motion.div>
            ) : (
              /* No video track → audio visualizer fills the space */
              <motion.div
                key="audio-visualizer"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeInOut' as const }}
                className="flex items-center justify-center"
              >
                <AudioVisualizer
                  isChatOpen={false}
                  audioVisualizerType={appConfig.audioVisualizerType ?? 'aura'}
                  audioVisualizerColor={visualizerColor}
                  audioVisualizerColorShift={appConfig.audioVisualizerColorShift}
                  audioVisualizerBarCount={appConfig.audioVisualizerBarCount}
                  audioVisualizerRadialBarCount={appConfig.audioVisualizerRadialBarCount}
                  audioVisualizerRadialRadius={appConfig.audioVisualizerRadialRadius}
                  audioVisualizerGridRowCount={appConfig.audioVisualizerGridRowCount}
                  audioVisualizerGridColumnCount={appConfig.audioVisualizerGridColumnCount}
                  audioVisualizerWaveLineWidth={appConfig.audioVisualizerWaveLineWidth}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Agent state badge — centred at the bottom of the visualizer ── */}
        <div className="pointer-events-none absolute bottom-5 left-1/2 z-10 -translate-x-1/2">
          <AnimatePresence mode="wait">
            <AgentStateBadge key={agentState} state={agentState} />
          </AnimatePresence>
        </div>

        <AnimatePresence>
          {localCameraTrack && (
            <motion.div
              key="local-camera-preview"
              drag
              dragMomentum={false}
              initial={{ opacity: 0, y: 20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.92 }}
              transition={{ duration: 0.2, ease: 'easeOut' as const }}
              className={cn(
                'absolute bottom-24 left-4 z-20 overflow-hidden',
                'w-32 sm:w-36 md:w-44',
                'rounded-2xl border border-border/40 bg-background/80 shadow-2xl backdrop-blur-md',
                chatOpen && 'md:left-6',
              )}
            >
              <div className="relative aspect-[3/4] bg-black/90">
                <VideoTrack
                  trackRef={localCameraTrack}
                  width={localCameraWidth}
                  height={localCameraHeight}
                  className="h-full w-full object-cover"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/45 to-transparent" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Avatar toggle — top-left corner ── */}
        <div className="absolute left-4 top-4 z-20">
          <AnimatePresence mode="wait">
            {isAvatar ? (
              /* Avatar is active → show a static "active" badge */
              <motion.span
                key="avatar-active"
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ duration: 0.2, ease: 'easeOut' as const }}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1',
                  'text-xs font-semibold shadow-sm backdrop-blur-sm',
                  'border border-indigo-500/25 bg-indigo-500/15 text-indigo-700',
                  'dark:bg-indigo-500/10 dark:text-indigo-400',
                )}
              >
                <BotIcon className="size-3" />
                数字人已启用
              </motion.span>
            ) : (
              /* Avatar not yet active → show enable button */
              <motion.div
                key="avatar-toggle"
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.75 }}
                transition={{ duration: 0.15, ease: 'easeOut' as const }}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="启用数字人"
                  disabled={avatarRequested}
                  onClick={handleEnableAvatar}
                  className={cn(
                    'rounded-full border border-border/30 px-3',
                    'bg-background/40 text-xs font-semibold backdrop-blur-sm',
                    'hover:bg-background/60 disabled:opacity-70',
                  )}
                >
                  {avatarRequested ? (
                    <>
                      <Loader2Icon className="size-3 animate-spin" />
                      连接中
                    </>
                  ) : (
                    <>
                      <BotIcon className="size-3" />
                      启用数字人
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Chat-open toggle — appears when the panel is hidden ── */}
        <AnimatePresence>
          {!chatOpen && (
            <motion.div
              key="chat-toggle"
              initial={{ opacity: 0, scale: 0.75 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.75 }}
              transition={{ duration: 0.15, ease: 'easeOut' as const }}
              className="absolute right-4 top-4 z-20"
            >
              <Button
                variant="ghost"
                size="icon"
                aria-label="打开对话记录"
                onClick={() => setChatOpen(true)}
                className={cn(
                  'size-9 rounded-full border border-border/30',
                  'bg-background/40 backdrop-blur-sm',
                  'hover:bg-background/60',
                )}
              >
                <MessageSquareTextIcon className="size-4" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Floating semi-transparent chat panel (right 25 %) ── */}
        <AnimatePresence>
          {chatOpen && (
            <motion.div
              key="chat-panel"
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ duration: 0.3, ease: 'easeInOut' as const }}
              className={cn(
                // Positioning: right edge, full height of the main area.
                'absolute right-0 top-0 bottom-0 z-20',
                // Width: 25 % of viewport, with a sensible floor on small screens.
                'w-1/4 min-w-[200px]',
                // Frosted-glass appearance.
                'flex flex-col',
                'border-l border-border/30',
                'bg-background/65 dark:bg-background/75',
                'backdrop-blur-xl',
              )}
            >
              {/* Panel header */}
              <div className="flex shrink-0 items-center justify-between border-b border-border/25 px-3 py-2.5">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  对话记录
                </span>

                <div className="flex items-center gap-1.5">
                  {messages.length > 0 && (
                    <span className="tabular-nums text-xs text-muted-foreground">
                      {messages.length} 条
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="关闭对话记录"
                    onClick={() => setChatOpen(false)}
                    className="size-6 rounded-full text-muted-foreground hover:text-foreground"
                  >
                    <XIcon className="size-3" />
                  </Button>
                </div>
              </div>

              {/* Panel body: real-time transcript */}
              <div className="min-h-0 flex-1 overflow-hidden">
                {hasTranscriptContent ? (
                  <AgentChatTranscript
                    agentState={agentState}
                    messages={messages}
                    className={cn(
                      'h-full',
                      // Tighten padding to suit the narrow panel.
                      '[&>div>div]:px-3 [&>div>div]:py-2',
                      // Slightly smaller text to keep messages readable in 25 % width.
                      '[&_.is-user>div]:text-xs [&_.is-user>div]:rounded-xl',
                      '[&_.is-assistant]:text-xs',
                    )}
                  />
                ) : (
                  <TranscriptEmptyState />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ────────────────────────────────────────────────────────────────────
          2. CONTROLS ZONE — fixed to the bottom, full width
          ──────────────────────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-border/40 px-4 py-3">
        <div className="mx-auto max-w-md">
          <AgentControlBar
            variant="livekit"
            controls={{
              leave: true,
              microphone: true,
              camera: appConfig.supportsVideoInput,
              screenShare: appConfig.supportsScreenShare,
              // The transcript panel is toggled separately; no in-bar chat toggle.
              chat: false,
            }}
            isConnected={session.isConnected}
            onDisconnect={session.end}
          />
        </div>
      </div>
    </section>
  );
}
