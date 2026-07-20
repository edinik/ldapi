# 模型拉取与推理强度设置

## Goal

改进安全设置中的 OpenAI-compatible AI 导入配置：管理员可从当前服务拉取模型并选择，同时可配置生成请求的推理强度，减少手工输入和配置错误，并继续兼容不能枚举模型或使用自定义模型名的服务。

## Background

- 当前安全设置在 `src/app/admin/security/page.tsx:170` 使用服务端表单保存 Base URL、模型和 API Key；模型字段位于 `src/app/admin/security/page.tsx:184`，目前是自由文本输入。
- 配置由 `src/lib/ai-settings.ts:57` 规范化，数据库值优先于环境变量；API Key 留空时保留已有密钥。
- 设置持久化由 `src/lib/ai-settings-store.ts:6` 的通用 `app_settings` 键管理，新增设置键无需修改数据库 schema 或迁移。
- AI 导入请求由 `src/lib/model-import-ai.ts:269` 构造，并在 `src/lib/model-import-ai.ts:372` 请求 `{baseUrl}/chat/completions`。
- 仓库已有统一推理强度集合：`none`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max`。

## Requirements

### R1 模型拉取与选择

- 安全设置的模型字段应支持管理员显式点击“拉取模型”。
- 拉取请求使用表单中当前填写的 Base URL 和新 API Key；字段留空时回退到已保存配置或环境变量。
- 服务端请求 OpenAI-compatible `GET {baseUrl}/models`，只向浏览器返回规范化后的模型 ID 列表或安全中文错误，不返回 API Key、完整上游响应或其他敏感信息。
- 拉取成功后，模型字段提供可搜索/可选择的候选项。
- 模型字段继续允许自由输入；当前值不在远端列表中时不得被清空、替换或阻止保存。
- 拉取失败时保留当前表单内容，并在字段附近显示明确错误和重试入口。

### R2 推理强度设置

- 安全设置增加一个可选的推理强度字段。
- 可选值为“默认（不传参数）”以及仓库已有的 `none`、`minimal`、`low`、`medium`、`high`、`xhigh`、`max`。
- 保存后重新打开页面应恢复已保存值；默认值以 `null` 存储。
- 选择非默认值时，AI 导入的 Chat Completions 请求增加 `reasoning_effort`；默认值不得发送该字段。
- 不因模型名称猜测支持范围；界面说明不兼容的服务可能拒绝该参数，用户可切回默认。

### R3 兼容性与安全

- 保持现有 Base URL、API Key、模型配置优先级和空 API Key 保留语义。
- 保持 `POST /api/models/import/generate` 的请求、成功响应、错误状态和元数据契约不变。
- API Key 只在服务端解析和使用，不进入页面 props、模型列表响应、日志或错误信息。
- 模型枚举不可用时，现有手工模型配置和 AI 生成流程仍可继续使用。

## Acceptance Criteria

- [x] AC1：填写或使用已有 Base URL/API Key 后点击“拉取模型”，可看到规范化、去重、排序后的模型 ID 候选项并选择一个模型。
- [x] AC2：远端返回失败、无效 JSON 或非 OpenAI-compatible 结构时，页面显示安全中文错误，当前模型/Base URL/API Key 输入不被重置。
- [x] AC3：用户可输入并保存远端列表之外的自定义模型名。
- [x] AC4：推理强度可保存并回显；选择默认时存储为 `null`。
- [x] AC5：选择强度时 `/chat/completions` 请求体包含对应 `reasoning_effort`；默认时请求体不含该键。
- [x] AC6：现有数据库优先、环境变量回退、Base URL 规范化和空 API Key 保留行为保持通过。
- [x] AC7：模型列表拉取和生成请求均在认证后的服务端边界执行，浏览器不获得有效 API Key。
- [x] AC8：针对配置解析、设置存储、模型列表响应规范化和生成请求体的自动化测试通过，完整 `npm run check`、`npm run build` 与 `git diff --check` 通过。

## Out of Scope

- 自动探测每个模型实际支持哪些推理强度。
- 为不同模型保存不同的 AI 导入推理强度。
- 改造模型管理目录中的能力/价格配置。
- 改用 OpenAI Responses API 或新增其他供应商专用协议。
