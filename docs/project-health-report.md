# Eveheart 项目体检报告

> 评估日期：2026-05-20  
> 范围：仓库结构、核心路由、数据层、RAG、认证、agent 服务、测试、构建与配置

## A. 总览结论

- 成熟度一句话：这是一个功能已经成形、但架构边界、交付链路和测试门禁都还不稳的早期生产项目。
- 总体评分：
  - 架构：5/10
  - 可维护性：4/10
  - 可测试性：3/10
  - 风险控制：2/10
  - 可扩展性：4/10
- 核心问题：
  1. 聊天、RAG、认证、持久化在 `apps/web/app/api/chat/route.ts` 中严重耦合。
  2. RAG 检索缺少明确的用户/租户边界，存在跨用户知识泄漏风险。
  3. `aiApiKey` 进入前端和数据库明文流转，敏感信息治理不足。
  4. `services/agent` 的实现、测试和 Docker 交付链路已经漂移。
  5. `pnpm lint` 失效，Web 只有类型检查，没有真正的测试门禁。

## B. 架构分层评估

### 当前判断

- 分层不是完全混乱，但已经明显“功能先堆起来，再补边界”。
- 现状更像是：
  - 接口层：`app/api/*`、`app/*/page.tsx`
  - 应用层：`lib/actions/*`
  - 基础设施层：`packages/db`、`packages/rag-db`
  - 公共层：`schemas/*`、少量 `lib/utils.ts`
- 问题在于应用层和接口层都在直接做业务编排、事务、外部调用和数据持久化。

### 应归属的层

- 接口层 / API 层
  - `apps/web/app/api/chat/route.ts`
  - `apps/web/app/api/auth/register/route.ts`
  - `apps/web/app/api/conversations/route.ts`
  - `apps/web/app/api/notifications/route.ts`
- 应用层 / Service 层
  - `apps/web/lib/actions/knowledge.ts`
  - `apps/web/lib/actions/preferences.ts`
  - `apps/web/lib/actions/account-setting.ts`
  - `apps/web/lib/actions/family-notifications.ts`
- 领域层 / Domain 层
  - 当前几乎缺失，应该补 `ChatSession`、`KnowledgeSource`、`FamilyRelationship`、`Notification` 的领域规则对象或领域服务。
- 基础设施层 / Infrastructure 层
  - `packages/db`
  - `packages/rag-db`
  - `apps/web/lib/rag/*`
  - `apps/web/lib/auth.ts`
  - `apps/web/lib/server/*`
- 公共组件层 / Common 层
  - `apps/web/schemas/*`
  - 部分纯函数工具，如 `cn`、`buildRagContext`、`generateChunks`

### 违反分层的地方

- `apps/web/app/api/chat/route.ts` 同时负责：
  - 鉴权
  - 会话校验
  - 模型解析
  - RAG 检索
  - prompt 注入
  - 消息持久化
- `apps/web/app/dashboard/setting/account-setting/page.tsx` 在页面层拼导出 Markdown。
- `apps/web/lib/utils.ts` 既是样式工具，又是配置加载器，又是 LiveKit token 适配器。
- `apps/web/lib/actions/family-notifications.ts` 已经接近 God Class / God Module。

## C. 模块解耦与边界

- 高耦合模块：
  - chat 路由与 RAG/DB/AI SDK
  - 偏好设置与密钥测试
  - 家属通知与情绪快照
  - agent 代码与测试
- 不合理依赖方向：
  - 前端页面直接接收完整偏好记录，包含 `aiApiKey`
  - RAG 数据层没有从请求上下文区分用户可见性
  - agent 测试依赖已过时的构造函数签名
- 应抽象的接口：
  - `ModelProviderResolver`
  - `EmbeddingProvider`
  - `RagRetriever`
  - `NotificationPublisher`
  - `ConversationExporter`
  - `SecretStore`
- 适合拆分的模块：
  - `chat`
  - `knowledge`
  - `family-notifications`
  - `services/agent`
  - `services/ai`
- 适合用事件 / 适配器 / 策略解耦的地方：
  - 知识库入库后生成 embedding
  - 情绪变化后通知家属
  - provider 选择与 baseUrl 适配
  - LiveKit / ASR / avatar 接入

## D. 风险清单

### P0：必须立即处理

1. RAG 跨租户泄漏
   - 影响范围：所有聊天用户
   - 触发条件：任意检索命中其他用户知识
   - 可能后果：私有知识泄漏、提示注入、越权回答
   - 建议：检索必须加用户/可见性过滤，并把知识分层为 private / shared / system
   - 原因：直接数据泄漏

2. `aiApiKey` 明文流转
   - 影响范围：自定义模型用户
   - 触发条件：加载偏好页或保存偏好
   - 可能后果：密钥出现在前端和数据库明文中
   - 建议：改为 secret store 或加密字段，前端只拿到脱敏状态
   - 原因：敏感信息安全问题

3. 自定义 baseUrl 的 SSRF 风险
   - 影响范围：服务端网络边界
   - 触发条件：用户配置恶意 baseUrl 并触发连接测试或模型调用
   - 可能后果：内网探测、元数据泄漏、恶意上游调用
   - 建议：限制域名、禁止私网地址、改走代理网关
   - 原因：高危网络安全问题

### P1：高优先级

1. `services/agent` 构建和代码已断链
   - 影响范围：语音 / 数字人功能
   - 触发条件：构建或运行 agent
   - 可能后果：部署失败、测试失败、功能不可用
   - 建议：统一 agent 入口，修复构造函数和缺失文件
   - 原因：已验证失败

2. `pnpm lint` 失效
   - 影响范围：整个 Web 工程
   - 触发条件：CI / 本地 lint
   - 可能后果：质量门禁失效
   - 建议：补 `eslint.config.js`
   - 原因：静态质量无法兜底

3. mock 接口被挂在生产路径
   - 影响范围：emotion / speech / digital human
   - 触发条件：调用占位 API 或页面
   - 可能后果：误导用户，污染产品预期
   - 建议：隔离实验功能或明确下线
   - 原因：功能可信度问题

4. 保留策略未真正执行
   - 影响范围：隐私与合规
   - 触发条件：用户选择自动删除策略
   - 可能后果：策略形同虚设
   - 建议：补后台清理任务
   - 原因：用户承诺未落地

### P2：中优先级

1. 知识库创建非事务化，embedding 失败会留下孤儿 source
2. 导出页面一次性拼全部 Markdown，数据量大时内存压力高
3. `lib/utils.ts` 工具职责过重
4. `family-notifications` 过大，后续维护成本高
5. Docker / README / 运行脚本不一致

### P3：低优先级

1. UI 组件库过多，风格和职责略显散
2. `services/ai` 当前更像实验集，而不是稳定产品模块
3. 一些公共文案和路径命名仍有历史包袱

## E. 测试评估

- 单元测试：`services/agent` 有，但当前已失败；Web 侧几乎没有成体系单测。
- 集成测试：缺失。
- 端到端测试：缺失。
- 契约测试：缺失。

### 关键路径缺口

- `/api/chat`
- 知识库增删改查
- 偏好设置保存与模型连接测试
- 注册 / 登录
- 家属邀请 / 接受 / 拒绝 / 删除
- 账户导出 / 清空 / 注销
- agent 语音入口

### 可测性改造建议

- 把 prompt 构造、RAG 过滤、关键词提取、quiet hours、导出 Markdown 改成纯函数。
- 把 DB 访问从 route / page 中抽到 repository。
- 把外部 provider 调用抽成 adapter，便于 mock。
- 把 `auth()` 结果和 request headers 改为显式上下文参数。

### 建议补的测试

- chat route：未授权、越权、模型 fallback、RAG 注入、消息持久化失败
- knowledge：embedding 失败、删除级联、chunk index 连续性
- preferences：secret 不下发、provider 校验、连接测试超时
- family：邀请幂等、状态机流转、权限校验
- agent：`voice_agent` 的入口、`my_voice_agent` 的 STT 转写

## F. 重构与优化建议

### 短期可做

1. 修复 lint 配置
   - 收益：恢复质量门禁
   - 成本：低
   - 风险：低

2. 去除偏好页对 `aiApiKey` 的直接下发
   - 收益：立刻降低密钥暴露风险
   - 成本：中
   - 风险：中

3. 给 RAG 加 tenant filter
   - 收益：阻断最严重的泄漏
   - 成本：中
   - 风险：中

4. 修复 agent 的构建和测试漂移
   - 收益：恢复语音链路可信度
   - 成本：低到中
   - 风险：低

### 中期重构

1. 拆 chat service
2. 拆 knowledge service
3. 拆 family-notifications service
4. 把 provider 解析、embedding、RAG 检索做成独立适配器
5. 把导出和清理做成后台任务

### 长期演进

1. 建立 domain 层
2. 用事件驱动串联通知、情绪、知识和审计
3. 把 `services/agent` 和 `services/ai` 独立成真正可部署服务

## G. 依赖与质量问题

- 依赖栈不算过多，但集成复杂度高。
- `next-auth` 仍是 beta，工具链升级不完整。
- 根目录和 `apps/web` 同时存在 lockfile，仓库卫生一般。
- `packages/db/prisma/generated` 和若干生成产物被跟踪，增加噪音。
- Docker 交付链路不完整，Web 镜像还把 `.env` 直接复制进镜像。
- 日志基本是 `console.*`，缺少结构化日志和可观测性设计。
- 超时、重试、幂等目前只有局部实现，没有统一基础设施。

## H. 最终行动清单

1. 立刻给 RAG 加用户边界和可见性控制。
2. 立刻把 `aiApiKey` 从前端与明文存储路径中移除。
3. 限制 custom provider 的 baseUrl，封住 SSRF 面。
4. 修复 `services/agent` 构建、入口与测试漂移。
5. 补 `eslint.config.js`，恢复 lint 门禁。
6. 为 `/api/chat`、知识库、偏好、家属通知补最小测试集。
7. 把保留策略做成真正的后台清理任务。
8. 把知识库创建改成可回滚或可补偿流程。
9. 把导出改成流式或异步任务。
10. 统一 Docker、README、env 示例和 workspace 边界。
11. 清理 tracked 的生成物和重复 lockfile。
12. 开始拆 application service，逐步补 domain 层。

## 已验证事实

- `pnpm build`：通过
- `pnpm lint`：失败，缺少 `eslint.config.js`
- `uv run python -m unittest discover -s tests`：失败，`my_agent.EveheartAgent` 构造签名与测试不一致

## 整改记录

- 2026-05-29：已将 `apps/web/lib/utils.ts` 拆分为更小的 focused helper 模块：
  - `apps/web/lib/utils.ts`：仅保留 `cn`
  - `apps/web/lib/browser/clipboard.ts`：浏览器剪贴板
  - `apps/web/lib/ai/message-parts.ts`：AI message parts 文本提取
  - `apps/web/lib/app-config/server.ts`：服务端 AppConfig 加载
  - `apps/web/lib/app-config/styles.ts`：AppConfig 样式生成
  - `apps/web/lib/livekit/sandbox-token-source.ts`：LiveKit sandbox token source
- 2026-05-29：已将 `apps/web/app/api/chat/route.ts` 拆分为更小的 chat 模块：
  - `apps/web/lib/chat/model-resolver.ts`：模型 provider 解析
  - `apps/web/lib/chat/prompt.ts`：系统 prompt 与 RAG prompt 拼接
  - `apps/web/lib/chat/rag-context.ts`：RAG 检索与消息注入
  - `apps/web/lib/chat/session-store.ts`：会话校验、偏好读取与消息持久化

