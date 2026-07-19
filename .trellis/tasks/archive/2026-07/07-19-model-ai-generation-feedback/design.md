# 完善模型 AI 生成反馈：技术设计

## Scope and Boundaries

本任务沿用现有调用链，只扩展可观察信息：

```text
ImportModelsClient
  -> POST /api/models/import/generate
  -> generateModelImportContent
  -> OpenAI-compatible /chat/completions
  -> 解析正文 + model + usage
  -> 既有导入解析器校验
  -> 路由返回可选元数据
  -> 客户端展示状态、耗时、模型和 Token
```

- `src/lib/model-import-ai.ts` 继续拥有外部请求、SSE/JSON 解析与上游字段归一化。
- Route Handler 继续拥有认证、HTTP status 和浏览器 DTO，不暴露 API key 或原始供应商负载。
- `ImportModelsClient.tsx` 继续拥有局部生成状态、计时和展示，不新增全局 store 或共享 Hook。

## Result Contract

服务层成功结果扩展为：

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

type ValidationResult =
  | { ok: true; content: string; metadata: ModelImportGenerationMetadata }
  | { ok: false; error: string; metadata?: ModelImportGenerationMetadata };
```

路由成功 JSON 返回 `{ content, metadata }`。失败继续使用既有 status：请求校验为 `400`、配置失败为 `500`、上游或生成内容失败为 `502`；当服务层已经获得元数据时，可把安全、规范化后的 `metadata` 与 `error` 一同返回。

客户端只信任可选 DTO 字段并对缺失值降级为 `null` / “未提供”。

## Response Parsing

### JSON response

- 正文继续从 `choices[0].message.content` 读取。
- 实际模型从顶层 `model` 读取。
- usage 从顶层 `usage` 读取。

### SSE response

- 逐行解析 `data:` JSON 块，继续拼接 `choices[0].delta.content`，兼容 `message.content`。
- 记录任意数据块中最后一个合法顶层 `model`。
- 记录任意数据块中最后一个合法顶层 `usage`；OpenAI 的 `include_usage` 通常在 `[DONE]` 前的独立最终块返回，且 `choices` 可能为空。
- `[DONE]` 只终止数据读取，不作为 JSON 解析。

### Usage normalization

所有外部值从 `unknown` 开始，只接受有限且非负的数字，避免 `NaN`、负数或字符串泄漏到 DTO。

字段优先级：

- 输入：`prompt_tokens`，回退 `input_tokens`。
- 输出：`completion_tokens`，回退 `output_tokens`。
- 缓存：`prompt_tokens_details.cached_tokens`；回退 `cached_tokens`；再回退 `cache_read_input_tokens + cache_creation_input_tokens`（只合计实际提供的非负值）。
- 思考：`completion_tokens_details.reasoning_tokens`；回退顶层 `reasoning_tokens`。
- 总计：优先 `total_tokens`；未提供时不自行根据分项推算，显示“未提供”。

不返回供应商原始 usage 对象，避免不稳定字段成为浏览器契约。

## Client State and Timing

客户端使用单一结果状态表达 `idle | generating | success | error` 所需的展示数据，保留现有 `generating` 布尔值或由状态派生，避免成功与错误同时出现。

- 请求开始记录 `Date.now()`，清除旧结果，启动 1 秒间隔更新已耗时。
- 30 秒后文案切换为“生成时间较长，请耐心等待”。
- `AbortController` 在 180 秒时中止浏览器请求，并显示明确超时原因。
- `try/catch/finally` 处理 HTTP 错误、网络错误、abort、响应 JSON 解析错误，并保证 interval、timeout 和 pending 状态清理。
- 成功只在路由返回非空 content 后更新左侧内容；流式过程不向浏览器透传部分 JSON。
- 最终耗时由请求开始到客户端收到并解析响应的时间计算，按秒显示。

## UI and Accessibility

- 生成按钮使用 `LoaderCircle` 的 `animate-spin` 状态。
- 生成卡片内增加状态 `Alert`，生成中与成功使用默认语义，失败使用 `destructive`。
- 状态容器使用 `aria-live="polite"`；错误使用 Alert 的可访问语义。
- 模型与 Token 使用紧凑的响应式网格，缺失统一显示“未提供”。
- 不引入新颜色系统；只使用 shadcn 语义 token、`Badge`、`Alert` 和现有布局。

## Compatibility and Security

- 不修改 AI 配置优先级、URL、请求 method、认证顺序或密钥边界。
- `requestedModel` 来自服务端解析后的配置，可安全展示；API key、base URL 和原始错误对象不返回客户端。
- 保留现有导入内容验证，usage/model 解析失败不能导致正文解析失败；缺失元数据仅降级显示。

## Rollback

改动不涉及数据库或迁移。回滚时可同时撤销服务结果元数据、路由可选字段和客户端状态面板；现有 `{ content }` 成功契约仍是扩展后的子集。
