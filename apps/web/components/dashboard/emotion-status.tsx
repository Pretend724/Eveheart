"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

export default function EmotionStatus() {
  const [emotion, setEmotion] = useState<{
    primary: string;
    score: number;
    face?: number;
    voice?: number;
    text?: number;
  }>({
    primary: "平静",
    score: 0.8,
    face: 0.7,
    voice: 0.8,
    text: 0.9,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>情绪状态</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">当前情绪</span>
            <span className="text-2xl font-bold">{emotion.primary}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">面部表情</span>
              <span>{((emotion.face || 0) * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(emotion.face || 0) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">语音情绪</span>
              <span>{((emotion.voice || 0) * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(emotion.voice || 0) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">文本情感</span>
              <span>{((emotion.text || 0) * 100).toFixed(0)}%</span>
            </div>
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${(emotion.text || 0) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
