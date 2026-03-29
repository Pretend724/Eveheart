"use client";
import { memo, useCallback } from "react";
import { MessageAction } from "@/components/ai-elements/message";
import { ThumbsDownIcon } from "lucide-react";

export interface DislikeActionProps {
  messageKey: string;
  isDisliked: boolean;
  onToggle: (key: string) => void;
}

const DislikeAction = memo(
  ({ messageKey, isDisliked, onToggle }: DislikeActionProps) => {
    const handleClick = useCallback(
      () => onToggle(messageKey),
      [messageKey, onToggle],
    );

    return (
      <MessageAction
        label="Dislike"
        onClick={handleClick}
        tooltip="Dislike this response"
      >
        <ThumbsDownIcon
          className="size-4"
          fill={isDisliked ? "currentColor" : "none"}
        />
      </MessageAction>
    );
  },
);

DislikeAction.displayName = "DislikeAction";
export default DislikeAction;
