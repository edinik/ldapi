# 技术设计

## Architecture and Ownership

```text
AdminSecurityPage（服务端：认证、读取设置、遮罩状态）
  -> AiGenerationSettingsForm（路由局部客户端组件：受控模型、候选列表、拉取状态）
      -> fetchAiGenerationModels Server Action
          -> ai-settings resolver（表单覆盖 > 存储 > 环境变量）
          -> OpenAI-compatible model list helper
              -> GET {baseUrl}/models
      -> saveAiGenerationSettings Server Action
          -> parseAiSettingsPayload
          -> ai-settings-store

POST /api/models/import/generate
  -> resolveOpenAiCompatibleConfig
  -> generateModelImportContent
      -> POST {baseUrl}/chat/completions
         + optional reasoning_effort
```

- `src/app/admin/security/page.tsx` 保持服务端组件，只负责认证、读取数据库、计算非敏感默认值并组合页面。
- 新建路由局部 `AiGenerationSettingsForm.tsx`，拥有拉取按钮、候选列表、受控模型值、推理强度选择和局部错误/加载状态。
- `src/app/admin/security/actions.ts` 继续作为认证后的 Server Action 边界。模型拉取 action 返回结果联合类型，不 redirect；保存 action 保持现有 redirect。
- `src/lib/ai-settings.ts` 是设置字段、推理强度校验、空值语义和有效配置优先级的唯一所有者。
- 新建纯外部集成辅助模块负责 `GET /models`、响应规范化、去重/排序和安全错误，不把协议解析塞入组件或 action。
- `src/lib/model-import-ai.ts` 继续拥有 Chat Completions 请求体；只扩展可选 `reasoningEffort` 输入和条件字段。

## Data Contracts

### Stored settings

```ts
type StoredAiSettings = {
  baseUrl: string | null;
  apiKey: string | null;
  model: string | null;
  reasoningEffort: ReasoningEffortLevel | null;
};
```

- 新增 `app_settings` 键 `ai.reasoning_effort`。
- `null` 表示使用供应商/模型默认值，生成请求不发送 `reasoning_effort`。
- 通用键值表已存在，不需要 Drizzle schema 或 migration。

### Model list result

```ts
type AiModelListActionResult =
  | { ok: true; models: string[] }
  | { ok: false; error: string };
```

- 上游预期响应为 `{ data: Array<{ id: string }> }`。
- 忽略缺失、非字符串或空白 ID；结果 trim、去重并稳定排序。
- HTTP 失败只暴露状态码；JSON/结构错误转换为固定中文错误，不透传供应商 payload。

### Generation config

```ts
type OpenAiCompatibleConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  reasoningEffort: ReasoningEffortLevel | null;
};
```

- `resolveOpenAiCompatibleConfig` 保留现有 baseUrl/apiKey/model 优先级。
- 请求体通过条件展开添加 `reasoning_effort`，因此默认值不会产生 `undefined` JSON 键。

## UI Behavior

- 模型控件复用现有 shadcn `Combobox`，支持键盘搜索、候选选择与自由文本。
- “拉取模型”是 `type="button"`，不会意外提交保存表单；pending 时 disabled 并展示加载状态。
- API Key 仍为 password 输入，页面只传 `hasConfiguredApiKey` 用于 placeholder，不传实际密钥。
- 推理强度复用 shadcn `Select`；通过显式 `name`/hidden input 保证 FormData 语义。
- 拉取成功但列表为空时显示“未返回可用模型”，不改变当前模型。

## Compatibility and Failure Handling

- 模型拉取是增强功能，不是保存前置条件。
- 现有自定义模型值始终保留，即使远端列表不包含它。
- 上游不支持 `/models`、需要不同权限或临时不可用时，仅影响候选加载。
- 上游不支持所选 `reasoning_effort` 时，生成仍沿既有 `502` 边界返回错误；用户可切回默认。
- 不改变 `/api/models/import/generate` 浏览器请求/响应 DTO，也不改变流式响应和 usage 元数据解析。

## Security

- Server Action 入口首先调用 `requireAdmin()`。
- 外部请求只在服务端执行；不创建把 API Key 返回客户端的 JSON API。
- action 错误不得包含 Authorization header、API Key 或完整上游 body。
- 不记录表单数据或外部请求 headers。

## Rollback

- 删除客户端表单与模型列表 action/helper，恢复页面原表单即可回退拉取功能。
- 删除 `ai.reasoning_effort` 读写与请求字段即可回退推理强度；遗留通用设置行不会影响旧代码。

