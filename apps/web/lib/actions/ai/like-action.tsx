"use client";
import { memo, useCallback } from "react";
import { MessageAction } from "@/components/ai-elements/message";
import { ThumbsUpIcon } from "lucide-react";

export interface LikeActionProps {
  messageKey: string;
  isLiked: boolean;
  onToggle: (key: string) => void;
}

const LikeAction = memo(
  ({ messageKey, isLiked, onToggle }: LikeActionProps) => {
    const handleClick = useCallback(
      () => onToggle(messageKey),
      [messageKey, onToggle],
    );

    return (
      <MessageAction
        label="Like"
        onClick={handleClick}
        tooltip="Like this response"
      >
        <ThumbsUpIcon
          className="size-4"
          fill={isLiked ? "currentColor" : "none"}
        />
      </MessageAction>
    );
  },
);

LikeAction.displayName = "LikeAction";
export default LikeAction;
