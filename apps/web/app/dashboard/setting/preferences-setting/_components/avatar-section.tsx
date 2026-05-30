"use client";

import Image from "next/image";
import { UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { AVATAR_OPTIONS } from "../_lib/preferences-data";
import type { AvatarIdentifier } from "../_lib/preferences-types";

export function AvatarSection({
  selectedAvatar,
  onAvatarChange,
}: {
  selectedAvatar: AvatarIdentifier | null;
  onAvatarChange: (avatar: AvatarIdentifier) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-xl font-bold">
          <UserIcon className="size-5 text-primary" />
          数字人形象选择
        </CardTitle>
        <CardDescription>
          选择数字人会话中使用的默认形象，保存后会同步到您的偏好设置。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {AVATAR_OPTIONS.map((option) => {
            const isSelected = selectedAvatar === option.id;

            return (
              <Card
                key={option.id}
                role="button"
                tabIndex={0}
                onClick={() => onAvatarChange(option.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onAvatarChange(option.id);
                  }
                }}
                className={cn(
                  "cursor-pointer gap-0 border-2 py-0 transition-all",
                  "hover:border-primary/50 hover:bg-muted/20",
                  isSelected && "border-primary bg-primary/5 shadow-sm",
                )}
              >
                <CardHeader className="px-0">
                  <div className="relative aspect-[4/5] w-full overflow-hidden border-b bg-muted">
                    <Image
                      src={option.imageSrc}
                      alt={option.name}
                      fill
                      className="object-cover"
                      sizes="(min-width: 768px) 320px, 100vw"
                    />
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-2 px-5 pt-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold">{option.name}</p>
                    <Badge variant={isSelected ? "default" : "secondary"}>
                      {isSelected ? "已选中" : "可选择"}
                    </Badge>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {option.description}
                  </p>
                </CardContent>
                <CardFooter className="border-t px-5 py-4">
                  <Button
                    type="button"
                    variant={isSelected ? "default" : "outline"}
                    className="w-full"
                    onClick={(event) => {
                      event.stopPropagation();
                      onAvatarChange(option.id);
                    }}
                  >
                    {isSelected ? "当前形象" : "选择该形象"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
