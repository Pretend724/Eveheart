"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
  MessageToolbar,
} from "@/components/ai-elements/message";
import {
  PromptInput,
  type PromptInputMessage,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputBody,
  PromptInputFooter,
} from "@/components/ai-elements/prompt-input";
import { Suggestion, Suggestions } from "@/components/ai-elements/suggestion";
import { MessageSquare, RefreshCcwIcon } from "lucide-react";
import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import type { UIMessage } from "ai";
import CopyAction from "@/lib/actions/ai/copy-action";

const suggestionItems = [
  "我最近心情有点低落，想聊聊",
  "感觉压力很大，不知道该怎么办",
  "晚上总是睡不着，有点焦虑",
];

interface ChatClientProps {
  sessionId: string;
  initialMessages: UIMessage[];
}

export default function ChatClient({
  sessionId,
  initialMessages,
}: ChatClientProps) {
  const [input, setInput] = useState("");

  const { messages, sendMessage, status } = useChat({
    messages: initialMessages,
    transport: new DefaultChatTransport({
      api: "/api/chat",
      prepareSendMessagesRequest({ messages }) {
        return {
          body: {
            messages,
            chatSessionId: sessionId,
          },
        };
      },
    }),
  });

  const handleSuggestionClick = (value: string) => {
    const text = value.trim();
    if (!text || status === "streaming") return;
    sendMessage({ text });
    setInput("");
  };

  const handleSubmit = (message: PromptInputMessage) => {
    if (message.text.trim()) {
      sendMessage({ text: message.text });
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden mx-auto w-full">
      <Conversation>
        <ConversationContent className="md:px-20">
          {messages.length === 0 ? (
            <ConversationEmptyState
              icon={<MessageSquare className="size-12" />}
              title="找个人聊聊吧"
              description="在这里，你可以放心倾诉，不必孤单"
            />
          ) : (
            messages.map((message) => (
              <Message from={message.role} key={message.id}>
                <MessageContent>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <MessageResponse key={`${message.id}-${i}`}>
                            {part.text}
                          </MessageResponse>
                        );
                      default:
                        return null;
                    }
                  })}
                </MessageContent>
                {message.role === "assistant" && (
                  <MessageToolbar>
                    <MessageActions>
                      <MessageAction
                        label="Retry"
                        onClick={() => console.log("retrying....")}
                        tooltip="Regenerate response"
                      >
                        <RefreshCcwIcon className="size-4" />
                      </MessageAction>
                      <CopyAction
                        content={message.parts
                          .filter((p) => p.type === "text")
                          .map((p) => (p as { type: "text"; text: string }).text)
                          .join("")}
                      />
                    </MessageActions>
                  </MessageToolbar>
                )}
              </Message>
            ))
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="flex flex-col shrink-0 border-t p-4 md:px-20">
        <Suggestions className="mb-3">
          {suggestionItems.map((suggestion) => (
            <Suggestion
              key={suggestion}
              suggestion={suggestion}
              onClick={handleSuggestionClick}
              disabled={status === "streaming"}
            />
          ))}
        </Suggestions>
        <PromptInput onSubmit={handleSubmit} className="mx-auto w-full">
          <PromptInputBody>
            <PromptInputTextarea
              value={input}
              placeholder="发消息..."
              onChange={(e) => setInput(e.currentTarget.value)}
              className="pr-12"
            />
          </PromptInputBody>
          <PromptInputFooter>
            <PromptInputSubmit
              status={status === "streaming" ? "streaming" : "ready"}
              disabled={!input.trim()}
              className="absolute bottom-1 right-1"
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
