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

## 配置变更

新增环境配置时，搜索并更新完整契约：解析器、`.env.example`、相关 Docker/Compose 传递、必要时的管理设置 UI、文档和测试。参考 `../guides/cross-layer-thinking-guide.md`。

## 禁止做法

- JSON API 不要使用 `requireAdmin()`，页面不要使用 `requireAuth()`。
- 不要记录密码、session ID、TOTP secret、Turnstile secret 或 AI API key。
- 不要在 Route Handler 中重复 base URL 规范化或配置优先级。
- 需要服务端密钥的外部服务不得由客户端组件直接调用。
