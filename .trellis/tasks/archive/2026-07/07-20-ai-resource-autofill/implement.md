# Implementation Plan

## 1. Resource AI domain helper

- [x] 新建 `src/lib/resource-ai.ts`。
- [x] 定义请求输入、生成建议和结果联合类型。
- [x] 实现标题、已有标签和 HTTP(S) URL 规范化。
- [x] 实现资源研究提示词：优先给定 GitHub/官网、否则标题搜索、严格 JSON、未知链接返回 null。
- [x] 沿用现有 AI 配置形状构造 `/chat/completions` 请求，并传递 `reasoning_effort` 与研究工具。
- [x] 解析普通 JSON/SSE assistant 内容（按真实响应需求选择最小兼容实现），提取 JSON 对象并验证建议。
- [x] 实现纯合并/候选过滤 helper，保证已有字段和标签优先。

## 2. Authenticated API route

- [x] 新建 `src/app/api/resources/generate/route.ts`。
- [x] 先执行 `requireAuth()`，再解析请求。
- [x] 读取 `getStoredAiSettings(db)` 并调用 `resolveOpenAiCompatibleConfig`。
- [x] 输入错误返回 400；配置错误返回安全错误；上游/生成错误返回 502；成功返回规范化 suggestion。
- [x] 确认任何响应均不包含 API Key、Authorization header、Base URL 或上游原始对象。

## 3. New-resource form interaction

- [x] 为 `ResourceForm` 增加 form ref、AI pending/feedback、abort controller 和候选标签状态。
- [x] 仅在 `isNew && type === "tool"` 时渲染“AI 生成内容”按钮和说明。
- [x] 从当前表单读取标题、GitHub、官网并发送请求。
- [x] 响应成功后重新读取当前值，只填充空简介和链接字段。
- [x] 在标签区以按钮/徽章展示未选中的 AI 候选，点击后复用 `addTag`。
- [x] 生成中提供 spinner 与状态文本；失败使用可访问的错误提示。
- [x] 类型切换或组件卸载时取消请求；保存 pending 与生成 pending 相互独立且不会触发表单提交。

## 4. Tests

- [x] 新建 `tests/resource-ai.test.ts`，覆盖提示词优先来源、请求体、推理强度和研究工具。
- [x] 覆盖有效 JSON、代码围栏/SSE（若支持）、无效 JSON、缺失简介、标签去重/限制和 URL 校验。
- [x] 覆盖 GitHub host 限制、非 HTTP(S) URL 和未知链接降级。
- [x] 覆盖合并规则：已有字段不覆盖、空字段填充、已有标签不重复、候选需主动选择。
- [x] 保持 `tests/admin-form-payloads.test.ts` 的现有资源保存负载通过。

## 5. Validation and Review Gates

- [x] 运行针对性测试：`npx tsx --test tests/resource-ai.test.ts tests/admin-form-payloads.test.ts`。
- [x] 运行 `npm run check`。
- [x] 在 check 完成后运行 `npm run build`。
- [x] 运行 `git diff --check`。
- [x] 复核完整数据流：表单 -> 认证 API -> AI 配置 -> 外部请求 -> 结构校验 -> 只填空字段 -> 原保存负载。
- [x] 复核浅色/深色、键盘焦点、非提交按钮类型及错误状态可访问性。

## Risky Files and Rollback Points

- `src/components/ResourceForm.tsx`：共享于新增和编辑资源；必须用 `isNew` 守住编辑页行为。
- `src/lib/resource-ai.ts`：外部不可信输出边界；任何校验失败都必须阻止回填。
- `src/app/api/resources/generate/route.ts`：密钥和认证边界；不得向浏览器透传供应商原始响应。
- 无数据库迁移；若功能不稳定，可独立移除新增端点/UI，不影响资源 CRUD。
