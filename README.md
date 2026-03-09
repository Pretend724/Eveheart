# Eveheart - AI情感陪护虚拟数字人系统

AI情感陪护虚拟数字人系统，通过语音、视频、文本多模态数据识别用户心理状态，并由虚拟数字人进行情绪回应和心理陪伴。

## 技术栈

### 前端

- Next.js (App Router)
- TypeScript
- TailwindCSS
- shadcn/ui
- React Server Components

### 认证

- NextAuth
- JWT Session
- Prisma Adapter

### 数据库

- PostgreSQL
- Prisma ORM

### 验证

- Zod

## 项目结构

```
project-root/
├── apps/
│   └── web/
│       ├── app/
│       │   ├── api/
│       │   │   ├── auth/
│       │   │   ├── chat/
│       │   │   ├── speech/
│       │   │   └── emotion/
│       │   ├── dashboard/
│       │   ├── login/
│       │   ├── register/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── globals.css
│       ├── components/
│       │   ├── ui/
│       │   └── dashboard/
│       ├── lib/
│       ├── schemas/
│       ├── hooks/
│       └── types/
└── packages/
    └── database/
        └── prisma/
```

## 开始使用

### 1. 安装依赖

```bash
cd apps/web
npm install
```

### 2. 设置环境变量

复制 `.env.example` 为 `.env`:

```bash
cp .env.example .env
```

编辑 `.env` 文件，填入你的数据库连接和认证密钥。

### 3. 初始化数据库

```bash
cd ../../packages/database
npx prisma generate
npx prisma db push
```

### 4. 运行开发服务器

```bash
cd ../../apps/web
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 功能特性

- ✅ 用户认证（注册/登录）
- ✅ Dashboard 界面
- ✅ 虚拟数字人展示
- ✅ 实时对话窗口
- ✅ 情绪状态监测
- 🚧 语音识别（Whisper）
- 🚧 语音合成（TTS）
- 🚧 情绪识别（多模态）
- 🚧 心理陪伴 LLM

## API 路由

### 认证

- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录（NextAuth）

### 对话

- `POST /api/chat` - 发送消息并获取 AI 回复

### 语音

- `POST /api/speech/asr` - 语音转文字

### 情绪

- `POST /api/emotion` - 多模态情绪识别

## 开发规范

所有 API 必须：

- 使用 Zod 进行输入验证
- 检查用户认证状态
- 使用 TypeScript 类型安全
- 遵循 RESTful 设计

## License

MIT
