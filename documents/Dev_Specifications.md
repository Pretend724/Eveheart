

# AI Emotional Companion Digital Human System

AI开发规范文档（Vibe Coding Prompt）

---

# 1 项目目标

你正在开发一个 **AI情感陪护虚拟数字人系统**。

系统提供：

* 数字人陪伴
* 语音对话
* 情绪识别
* 心理陪伴

系统通过 **语音、视频、文本** 多模态数据识别用户心理状态，并由 **虚拟数字人**进行情绪回应。

核心闭环：

```
感知 → 情绪识别 → LLM理解 → 心理干预 → 数字人反馈
```

目标用户：

```
老年人
情绪支持需求人群
```

---

# 2 技术栈

生成代码必须使用以下技术栈。

## 前端

```
Next.js (App Router)
TypeScript
TailwindCSS
shadcn/ui
React Server Components
```

---

## 认证系统

```
NextAuth
JWT Session
Prisma Adapter
```

---

## 数据库

```
PostgreSQL
Prisma ORM
```

---

## 数据验证

```
Zod
```

所有 API 输入必须使用 **Zod schema 验证**。

---

## AI 服务

```
Python
FastAPI
PyTorch
```

---

## AI 模型

Speech Recognition

```
Whisper
```

Text to Speech

```
Coqui TTS
```

Emotion Recognition

```
DeepFace
Speech Emotion Recognition
```

Talking Avatar

```
SadTalker
Wav2Lip
```

LLM

```
Qwen
Llama
```

RAG

```
LangChain
LlamaIndex
```

---

# 3 系统架构

系统架构如下：

```
Frontend (Next.js)
        │
        │ REST / WebSocket
        │
API Gateway (Next.js)
        │
        │
 ┌─────────────┬─────────────┬─────────────┐
 │             │             │             │
Speech AI   Emotion AI    LLM Agent    Avatar AI
Python      Python        Python       Python
```

---

# 4 项目目录结构

AI生成代码必须遵循以下结构。

```
project-root

apps
 ├ web
 │  ├ app
 │  │  ├ login
 │  │  ├ register
 │  │  ├ dashboard
 │  │  └ api
 │  │
 │  ├ components
 │  ├ hooks
 │  ├ lib
 │  └ schemas
 │
 ├ speech-service
 ├ emotion-service
 ├ agent-service
 └ avatar-service

packages
 ├ database
 └ config

infra
 └ docker
```

---

# 5 用户认证系统

使用 **NextAuth + Prisma Adapter**。

认证方式：

```
Email + Password
JWT Session
```

---

# 6 Prisma 数据模型

## User

```
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now())

  sessions  Session[]
  chats     Message[]
}
```

---

## Session（聊天会话）

```
model Session {
  id        String   @id @default(uuid())
  userId    String
  createdAt DateTime @default(now())

  messages  Message[]

  user User @relation(fields: [userId], references: [id])
}
```

---

## Message

```
model Message {
  id        String   @id @default(uuid())
  sessionId String
  role      String
  content   String
  createdAt DateTime @default(now())

  session Session @relation(fields: [sessionId], references: [id])
}
```

---

## EmotionLog

```
model EmotionLog {
  id        String   @id @default(uuid())
  sessionId String
  emotion   String
  score     Float
  source    String
  createdAt DateTime @default(now())
}
```

---

# 7 Zod 数据验证

所有 API 必须使用 **Zod 验证**。

示例：

```
schemas/user.ts
```

```
import { z } from "zod"

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional()
})
```

---

# 8 注册 API

```
POST /api/auth/register
```

Input

```
email
password
name
```

必须：

```
Zod验证
密码加密 bcrypt
保存数据库
```

---

# 9 登录系统

使用 **NextAuth Credentials Provider**。

配置：

```
/app/api/auth/[...nextauth]/route.ts
```

NextAuth 需要：

```
PrismaAdapter
CredentialsProvider
JWT Session
```

---

# 10 登录页面

路径：

```
/login
```

页面需要：

```
email
password
登录按钮
```

组件使用：

```
shadcn/ui
```

---

# 11 注册页面

路径：

```
/register
```

页面需要：

```
name
email
password
```

提交到：

```
POST /api/auth/register
```

---

# 12 Dashboard 页面

路径：

```
/dashboard
```

必须 **登录后访问**。

功能：

```
数字人显示
聊天窗口
语音输入
情绪状态
```

---

# 13 API 认证

所有 API 必须检查 session。

示例：

```
getServerSession
```

未登录：

```
return 401
```

---

# 14 AI聊天 API

```
POST /api/chat
```

Input

```
message
emotion
history
```

使用 Zod：

```
ChatSchema
```

然后调用：

```
agent-service
```

---

# 15 语音识别 API

```
POST /api/speech/asr
```

调用：

```
speech-service
```

---

# 16 情绪识别 API

```
POST /api/emotion
```

输入：

```
video
audio
text
```

输出：

```
emotion
confidence
```

---

# 17 多模态情绪融合

算法：

```
emotion_score =
0.4 * face
0.3 * voice
0.3 * text
```

---

# 18 心理陪伴 Prompt

LLM生成回复必须遵循：

```
你是一名温和的心理陪伴助手。

你的任务：

1 倾听用户
2 表达理解
3 提供温柔建议
4 避免说教
5 保持简短自然
```

---

# 19 Docker 服务

系统使用 docker-compose：

```
services

web
postgres
redis

speech-service
emotion-service
agent-service
avatar-service
```

---

# 20 MVP功能

系统最小功能：

```
用户注册
用户登录
语音输入
Whisper识别
LLM回复
TTS语音
数字人说话
```

---

# 21 GitHub Topics

开发过程中参考：

数字人

[https://github.com/topics/digital-human](https://github.com/topics/digital-human)

Lip Sync

[https://github.com/topics/lip-sync](https://github.com/topics/lip-sync)

语音识别

[https://github.com/topics/speech-recognition](https://github.com/topics/speech-recognition)

语音合成

[https://github.com/topics/text-to-speech](https://github.com/topics/text-to-speech)

情绪识别

[https://github.com/topics/emotion-recognition](https://github.com/topics/emotion-recognition)

多模态AI

[https://github.com/topics/multimodal-ai](https://github.com/topics/multimodal-ai)

LLM

[https://github.com/topics/large-language-model](https://github.com/topics/large-language-model)

心理健康

[https://github.com/topics/mental-health](https://github.com/topics/mental-health)

---

# 22 AI开发规则

生成代码必须：

```
模块化
类型安全
Zod验证
Prisma ORM
```

避免：

```
any类型
硬编码
单文件架构
```

---

# 23 最终系统目标

系统最终必须支持：

```
用户登录
语音聊天
情绪识别
心理陪伴
数字人表达
```

---
