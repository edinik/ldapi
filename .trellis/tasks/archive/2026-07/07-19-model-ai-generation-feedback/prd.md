# 完善模型 AI 生成反馈

## Goal

让管理员点击“AI 生成”后立即看到明确、持续且可访问的执行反馈，并在请求结束后知道成功或失败原因、耗时、实际使用模型及上游提供的 Token 用量，避免长时间无响应造成误判和重复提交。

## Background

- `src/app/admin/models/import/ImportModelsClient.tsx` 已有 `generating` 与 `generateError` 状态，但生成中仅替换按钮文字，成功后没有独立反馈，且 `fetch`、响应解析或网络异常会跳过状态恢复。
- `src/lib/model-import-ai.ts` 已向 OpenAI-compatible `/chat/completions` 请求发送 `stream_options: { include_usage: true }`，但当前响应解析只保留 assistant 正文，丢弃响应模型与 usage。
- OpenAI-compatible 上游的 usage 字段并不统一；部分服务不会返回缓存 Token、推理 Token或实际模型。
- AI 生成内容必须先通过既有导入解析器验证，只有有效 JSON 才能替换左侧导入内容。

## Requirements

### R1. 生成中反馈

- 点击“AI 生成”后按钮立即进入禁用状态，并显示旋转加载图标和生成中文案。
- 生成区域持续显示实时递增的已耗时秒数。
- 请求超过 30 秒仍未结束时，显示生成时间较长但请求仍在继续的提示。
- 请求达到 180 秒仍未结束时由客户端中止，并以超时失败结束；该限制不改变服务端上游配置。
- 同一时间只允许一个生成请求，输入框在生成期间保持禁用。

### R2. 结束状态

- 成功时显示“生成成功”、最终耗时以及模型和 Token 统计，并用通过验证的 JSON 替换导入内容。
- 失败时显示“生成失败”、最终耗时和可理解的失败原因。
- 网络错误、非 JSON 路由响应及其他客户端异常必须被捕获；无论成功或失败，按钮和输入框都必须恢复可操作状态。
- 发起下一次生成时清除上一次成功/失败状态，保留当前输入内容直至新结果验证成功。

### R3. 模型信息

- 结果中显示请求所使用的配置模型。
- 上游响应提供 `model` 时，同时显示实际响应模型；未提供时明确显示“未提供”，不得猜测。

### R4. Token 用量

- 归一化并展示输入、输出、缓存、思考和总 Token。
- 兼容常见 OpenAI-compatible 字段，包括 `prompt_tokens`、`completion_tokens`、`total_tokens`、`prompt_tokens_details.cached_tokens` 与 `completion_tokens_details.reasoning_tokens`。
- 对兼容服务返回的等价字段进行安全归一化，例如 `input_tokens`、`output_tokens`、`cache_read_input_tokens`、`cache_creation_input_tokens` 和 `reasoning_tokens`。
- 上游未提供的统计项显示“未提供”，不得用字符数自行估算。
- 普通 JSON 响应和 SSE 最终 usage 数据块都应被解析；解析 usage 不得破坏现有正文拼接与导入校验。

### R5. 兼容性与展示

- 保留现有生成接口 URL、method、认证、外部失败到 `502` 的边界以及成功正文契约，并以可选元数据扩展响应。
- 使用现有 shadcn `Alert`、`Button`、`Badge` 等语义组件与 lucide 图标，兼容日间/夜间主题和移动端布局。
- 动态状态区域使用合适的 `aria-live` / `role`，让辅助技术能够获知生成状态变化。

## Acceptance Criteria

- [x] AC1：点击生成后立即出现旋转加载状态和实时耗时，按钮与输入框不可重复触发；超过 30 秒出现长耗时提示。
- [x] AC2：成功后显示最终耗时、请求模型、实际模型以及上游提供的输入/输出/缓存/思考/总 Token，并更新有效导入 JSON。
- [x] AC3：上游缺少某个模型或 Token 字段时，对应位置显示“未提供”，其他已提供统计仍正常显示。
- [x] AC4：HTTP 错误、网络错误、非 JSON 路由响应及无效 AI 内容均显示具体失败信息和最终耗时，控件随后恢复。
- [x] AC5：JSON 与 SSE 响应中的模型/usage 均有针对性测试，现有正文解析和导入校验测试继续通过。
- [x] AC6：页面状态反馈在键盘操作、移动端及日间/夜间主题下可读，状态变化可由辅助技术感知（按用户要求未执行浏览器手工验证，已通过语义源码复核、lint 与生产构建）。

## Out of Scope

- 估算上游未返回的 Token 数量或费用。
- 将本次生成统计持久化到数据库或建立历史记录。
- 修改后台 AI 配置字段、密钥管理或模型选择方式。
- 在生成完成前导入或预检尚未通过校验的部分 JSON。
- 在流式生成过程中把尚未验证的部分 JSON 写入左侧文本框；已确认仅显示状态与耗时，完整校验成功后一次性替换。
