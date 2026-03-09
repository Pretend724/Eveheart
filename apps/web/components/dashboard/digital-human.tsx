"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

export default function DigitalHuman() {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <Card className="h-[600px]">
      <CardHeader>
        <CardTitle>虚拟数字人</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center h-[500px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-64 h-64 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
            <span className="text-8xl">👤</span>
          </div>
          <p className="text-sm text-muted-foreground">
            数字人正在等待与您对话...
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
