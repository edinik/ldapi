# 认证与外部集成

## 认证边界

- `requireAdmin()` 用于服务端页面和 action。缺少或无效 session 时重定向到 `/login`；它不得在服务端组件渲染期间删除 cookie，因为 Next.js 只允许 Server Action 或 Route Handler 修改 cookie。
- `requireAuth()` 用于 Route Handler。它返回 `401` JSON，而不是 redirect。
- 必须保留这一区别：API 客户端不应意外收到 HTML redirect，页面也不应渲染 JSON 错误。
- Session cookie 为 HTTP-only、`sameSite: "lax"`、path 为 `/`，生产环境启用 secure。登录同时创建七天数据库 session 和 cookie。
- 退出登录在存在 session 时删除数据库记录和 cookie，并相对请求 origin 重定向。

无效浏览器 cookie 可以留到登录或退出 Route Handler 覆盖/清除。不要在 `requireAdmin()` 中调用 `cookieStore.delete()`：数据库重置或 session 过期后，这会在页面渲染时报 `Cookies can only be modified in a Server Action or Route Handler`，而不是正常重定向。

参考：`src/lib/session.ts`、`src/lib/auth.ts`、`src/app/api/auth/login/route.ts` 和 `src/app/api/auth/logout/route.ts`。

## 可测试编排

多步骤策略应尽可能独立于 Next runtime。`authenticateLogin()` 接收 Turnstile、用户查询、密码验证、TOTP 和 session 创建依赖，使行为测试无需读取源码文本即可证明顺序和结果。

预期内认证失败使用结果联合类型；框架响应构造保留在 Route Handler 边界。

## 密码与 TOTP

- 密码 hash 和验证位于 `src/lib/password.ts`；不要在路由或脚本中新增另一种密码格式。
- TOTP 规范化、生成、验证、URI 构造和二维码生成位于 `src/lib/totp.ts`。
- 认证码比较使用 timing-safe compare。
- 待确认 TOTP secret 与启用中的 secret 是不同数据库字段。确认设置时提升 pending secret；禁用时清空两者。

## Turnstile

- Turnstile 为可选功能。只有配置 `TURNSTILE_SECRET_KEY` 时服务端才要求验证；只有存在 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 时浏览器才渲染组件。
- Secret 只能留在服务端；只有 `NEXT_PUBLIC_` site key 可以进入浏览器。
- `verifyTurnstileToken()` 拥有 Cloudflare 请求，并为登录策略返回 boolean。
- 使用注入 fetcher 或 mock 边界测试可选、成功、失败和网络错误。

## OpenAI-compatible 模型导入

- 配置解析由 `src/lib/ai-settings.ts` 拥有；数据库设置优先于环境变量，base URL 只规范化一次。
- API key 在展示时被遮罩，提交空 key 会保留已有存储值。
- `src/lib/model-import-ai.ts` 拥有请求构造、流式/非流式响应解析、JSON 提取和通过现有导入解析器执行的校验。
- 集成测试注入 `fetcher`。不得把 API key 暴露给客户端组件或 API 响应。
- 上游失败应转换成既有路由响应，不要泄漏原始供应商负载。

## 场景：AI 导入模型枚举与推理强度

### 1. Scope / Trigger

- 修改安全设置中的 AI 模型选择、`fetchAiGenerationModels` Server Action、`GET {baseUrl}/models` 集成、`ai.reasoning_effort` 设置或 Chat Completions 的 `reasoning_effort` 字段时，必须保持本节契约。
- 模型枚举是辅助输入，不是保存或生成的前置条件；不支持 `/models` 的兼容服务必须仍可使用手工模型名。

### 2. Signatures

```ts
type StoredAiSettings = {
  baseUrl: string | null;
  apiKey: string | null;
  model: string | null;
  reasoningEffort: ReasoningEffortLevel | null;
};

type OpenAiCompatibleModelListResult =
  | { ok: true; models: string[] }
  | { ok: false; error: string };
```

- 持久化键为 `ai.base_url`、`ai.api_key`、`ai.model`、`ai.reasoning_effort`；通用 `app_settings` 表无需新增 schema 字段。
- 推理强度复用 `src/lib/site-model-capabilities.ts` 的 `ReasoningEffortLevel` 集合。

### 3. Contracts

- 模型拉取只在认证后的 Server Action 中执行；表单中非空 Base URL/API Key 优先，随后回退已存设置和环境变量。
- 上游请求为 `GET {normalizedBaseUrl}/models`，包含服务端 `Authorization: Bearer <apiKey>` 和 `Accept: application/json`。
- 只接受 `{ data: Array<{ id: string }> }`；模型 ID trim、过滤空值、去重并排序后返回浏览器。
- 浏览器只获得模型 ID 或安全中文错误，不得获得 API key、Authorization header、完整上游 body 或供应商原始对象。
- `reasoningEffort === null` 表示使用供应商默认，Chat Completions 请求体不得包含 `reasoning_effort`；非空时原值传入该字段。
- 保持 `POST /api/models/import/generate` 的 `{ query }` 请求与 content/metadata 响应契约不变。

### 4. Validation & Error Matrix

| 条件 | 行为 |
|---|---|
| 表单 API Key 为空但存储/环境变量存在 | 使用服务端已有密钥，不向浏览器返回密钥 |
| 所有 API Key 来源均为空 | 返回 `缺少 AI 配置：AI_API_KEY` |
| `/models` 返回非 2xx | 返回只包含 HTTP 状态码的中文错误，不读取/透传 body |
| `/models` 返回无效 JSON | 返回 `模型列表返回的不是有效 JSON` |
| JSON 缺少 `data` 数组 | 返回 `模型列表响应格式不兼容` |
| `data` 中 ID 缺失、非字符串或空白 | 忽略该项，其他合法 ID 继续返回 |
| 推理强度为空或非法 | 规范化为 `null`，请求不发送 `reasoning_effort` |
| 上游不支持所选推理强度 | 保持既有生成 `502` 错误边界，管理员可切回默认 |

### 5. Good / Base / Bad Cases

- Good：管理员用当前表单地址和新密钥拉取模型，选择候选并保存 `high`；生成请求发送 `reasoning_effort: "high"`。
- Base：服务不支持模型枚举，页面显示安全错误并保留自定义模型名；推理强度为默认，生成请求不含该字段。
- Bad：客户端直接请求供应商 `/models`、把已存 API key 传入 props，或因模型列表失败而清空/禁止保存手工模型名。

### 6. Tests Required

- 配置解析：合法/空/非法推理强度，以及表单覆盖 > 存储 > 环境变量的连接优先级。
- 设置存储：`ai.reasoning_effort` 的保存、读取和清空，同时保持空 API key 不覆盖已有密钥。
- 模型列表 helper：URL、method、headers、ID 规范化、HTTP/JSON/结构/网络错误与错误信息不泄密。
- 生成请求：非空推理强度发送 `reasoning_effort`；默认值确认请求体不存在该键。
- 浏览器回归：拉取失败不重置 Base URL、API Key 或自定义模型输入，控制台无 Base UI 语义错误。

### 7. Wrong vs Correct

#### Wrong

```ts
// 泄漏密钥到客户端，并把枚举成功错误地作为保存前提。
fetch(`${baseUrl}/models`, { headers: { Authorization: `Bearer ${apiKey}` } });
if (models.length === 0) disableSave();
```

#### Correct

```ts
const connection = resolveOpenAiCompatibleConnection(process.env, storedSettings, formInput);
if (!connection.ok) return connection;
return listOpenAiCompatibleModels(connection.connection); // 只返回 ID 或安全错误
```

## 场景：模型导入生成的模型与 Token 元数据

### 1. Scope / Trigger

- 修改 `src/lib/model-import-ai.ts` 的 Chat Completions 请求、SSE/JSON 响应解析，或 `/api/models/import/generate` 的浏览器响应时，必须保持本节契约。
- `stream_options.include_usage` 的最终 SSE 数据块通常没有 `choices`，因此正文与 usage 必须独立解析；否则页面会生成成功但丢失统计。

### 2. Signatures

```ts
type ModelImportGenerationMetadata = {
  requestedModel: string;
  responseModel: string | null;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    cachedTokens: number | null;
    reasoningTokens: number | null;
    totalTokens: number | null;
  };
};
```

- `POST /api/models/import/generate` 请求保持 `{ query: string }`。
- 成功响应为 `{ content: string, metadata: ModelImportGenerationMetadata }`。
- 已获得安全元数据的 `502` 响应可以为 `{ error: string, metadata?: ModelImportGenerationMetadata }`。

### 3. Contracts

- `requestedModel` 来自服务端已解析配置；`responseModel` 只接受上游顶层非空 `model`。
- 输入/输出优先读取 `prompt_tokens` / `completion_tokens`，回退 `input_tokens` / `output_tokens`。
- 缓存优先读取 `prompt_tokens_details.cached_tokens`，再回退 `cached_tokens` 或 `cache_read_input_tokens + cache_creation_input_tokens`。
- 思考优先读取 `completion_tokens_details.reasoning_tokens`，回退 `reasoning_tokens`。
- `totalTokens` 只读取 `total_tokens`，不根据分项估算。所有缺失值为 `null`，浏览器展示“未提供”。
- 只返回规范化字段；不得返回 API key、base URL 或供应商原始 usage/error 对象。

### 4. Validation & Error Matrix

| 条件 | 行为 |
|---|---|
| Token 值是非负有限 number | 接受并映射到 DTO |
| Token 值是字符串、负数、`NaN` 或无限值 | 作为 `null`，继续解析正文 |
| SSE 最终块 `choices: []` 且包含 usage | 收集 usage，不影响已拼接正文 |
| 上游缺少 model 或 usage | 生成仍可成功，对应字段为 `null` |
| 正文缺失、JSON 无效或导入校验失败 | 保持既有 `502` 错误边界，可附带已规范化 metadata |
| 上游 HTTP 失败 | 返回既有中文错误摘要，不透传原始对象 |

### 5. Good / Base / Bad Cases

- Good：SSE 内容块逐段拼接，最终空 choices 块提供 model 和完整 usage，返回经过导入校验的 content 与 metadata。
- Base：供应商只返回有效 content，没有 model/usage；content 成功，统计全部为 `null`。
- Bad：把字符串 `"120"` 强转为 Token，或因为最终块没有 choices 而跳过 usage；这会把不可信值或错误的“未提供”状态送到 UI。

### 6. Tests Required

- JSON 响应：断言 content、请求模型、实际模型和 OpenAI usage details。
- SSE 响应：最终 `choices: []` usage 块仍被读取，正文拼接保持正确。
- 兼容字段：断言 `input_tokens` / `output_tokens`、缓存字段合计和 `reasoning_tokens`。
- 非法/缺失字段：断言降级为 `null`，且不破坏生成成功与既有错误文案。

### 7. Wrong vs Correct

#### Wrong

```ts
if (!choices?.length) continue; // 会跳过 include_usage 的最终 SSE 块
```

#### Correct

```ts
responseModel = readModel(payload) ?? responseModel;
usage = readUsage(payload) ?? usage;
appendAssistantContent(payload); // 正文解析与 metadata 解析彼此独立
```

## 场景：新增工具资源的 AI 资料生成

### 1. Scope / Trigger

- 修改 `POST /api/resources/generate`、`src/lib/resource-ai.ts`、`resource-ai-contract.ts` 或新增资源表单的 AI 回填行为时，必须保持本节契约。
- 该能力只用于新增 `tool` 资源；教程和资源编辑页不应隐式获得生成入口。

### 2. Signatures

```ts
type ResourceAiRequest = {
  title: string;
  githubUrl: string | null;
  officialUrl: string | null;
  existingTags: string[];
};

type ResourceAiSuggestion = {
  description: string;
  tags: string[];
  githubUrl: string | null;
  officialUrl: string | null;
  demoUrl: string | null;
};
```

- 浏览器请求为 `{ title, githubUrl?, officialUrl?, existingTags? }`。
- 成功响应为 `{ suggestion: ResourceAiSuggestion }`；输入错误为 `400`，AI 配置错误为 `500`，上游或生成校验失败为 `502`。

### 3. Contracts

- 路由先调用 `requireAuth()`，再解析请求；AI 配置继续由 `getStoredAiSettings()` 和 `resolveOpenAiCompatibleConfig()` 统一解析。
- Chat Completions 请求使用共享 `openAiResearchTools`、已配置模型及可选 `reasoning_effort`。有 GitHub/官网时提示 AI 优先核对这些来源，否则按标题研究。
- 应用服务器不得直接抓取用户或 AI 提供的任意第三方 URL；网页访问交给已配置 AI 服务的研究工具，避免新增 SSRF 通道。
- `resource-ai-contract.ts` 是客户端安全的请求/响应校验与合并所有者；`resource-ai.ts` 拥有上游请求和 SSE/JSON 解析。客户端组件不得导入服务端生成 helper。
- 简介必须非空且不超过 240 字符；标签 trim、大小写不敏感去重、最多 6 个且至少 2 个。
- GitHub 只接受 `github.com` HTTP(S) 地址；官网和演示站只接受 HTTP(S)，非法 AI 链接降级为 `null`。
- 回填时重新读取响应到达时的表单值：只填空简介/链接；标签只作为未选中候选，用户点击后才加入。
- 浏览器只获得规范化 suggestion 或安全中文错误，不得获得 API key、base URL、Authorization header 或供应商原始对象。

### 4. Validation & Error Matrix

| 条件 | 行为 |
|---|---|
| 标题为空或超过 200 字符 | `400`，不发起上游请求 |
| 输入官网不是 HTTP(S)，或 GitHub 不是 `github.com` | `400`，指出对应字段 |
| 未配置 AI key/model | `500`，返回统一配置错误 |
| 上游非 2xx、网络失败、SSE/JSON 无正文 | `502`，只返回安全摘要 |
| AI 简介为空/过长或有效标签少于 2 个 | `502`，不向表单回填任何内容 |
| AI 链接协议或 GitHub host 非法 | 对应链接变为 `null`，其他有效建议仍可使用 |
| 响应到达时字段已有用户值 | 保留用户值，只填仍为空的字段 |
| 生成期间切换为教程或组件卸载 | 取消/忽略结果，不修改表单 |

### 5. Good / Base / Bad Cases

- Good：管理员填标题和 GitHub，服务端用研究工具核对来源，返回有效简介/标签/链接；客户端只填空字段并展示候选标签。
- Base：仅有标题，AI 找到简介和标签但无法确认链接；链接保持 `null`，用户仍可审阅生成内容。
- Bad：客户端直接调用供应商、把 API key 放进 props，服务端主动 `fetch` 任意用户 URL，或 AI 响应覆盖用户等待期间填写的内容。

### 6. Tests Required

- 请求解析：标题、HTTP(S)、GitHub host、标签 trim/去重与错误文案。
- 提示词/请求体：优先来源说明、共享研究工具、模型、stream 和可选 `reasoning_effort`。
- 响应解析：普通 JSON、SSE、代码围栏、缺失正文、无效 JSON 和安全 HTTP 错误。
- suggestion 校验：简介长度、标签数量/去重、GitHub/官网/演示站 URL 降级。
- 合并：已有字段不覆盖、空字段填充、已有标签不重复、候选标签不自动选择。
- 完整质量门还需证明服务端研究提示词不进入客户端静态包。

### 7. Wrong vs Correct

#### Wrong

```ts
// 把外部请求 helper 打进客户端，并直接覆盖用户输入。
import { generateResourceAiSuggestion } from "@/lib/resource-ai";
setDescription(suggestion.description);
```

#### Correct

```ts
import { mergeResourceAiSuggestion } from "@/lib/resource-ai-contract";

const merged = mergeResourceAiSuggestion(readCurrentFormValues(), suggestion);
applyOnly(merged.filledFields, merged.values);
```

## 配置变更

新增环境配置时，搜索并更新完整契约：解析器、`.env.example`、相关 Docker/Compose 传递、必要时的管理设置 UI、文档和测试。参考 `../guides/cross-layer-thinking-guide.md`。

## 禁止做法

- JSON API 不要使用 `requireAdmin()`，页面不要使用 `requireAuth()`。
- 不要记录密码、session ID、TOTP secret、Turnstile secret 或 AI API key。
- 不要在 Route Handler 中重复 base URL 规范化或配置优先级。
- 需要服务端密钥的外部服务不得由客户端组件直接调用。
