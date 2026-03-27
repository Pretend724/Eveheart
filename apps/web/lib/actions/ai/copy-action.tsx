"use client";
import { memo, useCallback } from "react";
import { MessageAction } from "@/components/ai-elements/message";
import { CopyIcon } from "lucide-react";
import { handleCopy } from "@/lib/utils";

export interface CopyActionProps {
  content: string;
}

const CopyAction = memo(({ content }: CopyActionProps) => {
  const handleClick = useCallback(() => handleCopy(content), [content]);

  return (
    <MessageAction
      label="Copy"
      onClick={handleClick}
      tooltip="Copy to clipboard"
    >
      <CopyIcon className="size-4" />
    </MessageAction>
  );
});

CopyAction.displayName = "CopyAction";
export default CopyAction;
