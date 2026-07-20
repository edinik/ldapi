# 实施计划

## Checklist

1. 扩展 `src/lib/ai-settings.ts`：加入推理强度解析、设置类型和解析后的生成配置，保持原有优先级与空值语义。
2. 扩展 `src/lib/ai-settings-store.ts`：读写 `ai.reasoning_effort`，保持空 API Key 不覆盖已有值。
3. 新增 OpenAI-compatible 模型列表纯辅助模块：服务端 `GET /models`、认证 header、超时/HTTP/JSON/结构错误处理、ID 规范化去重排序。
4. 扩展 `src/app/admin/security/actions.ts`：保存推理强度；新增认证后的模型拉取 action，使用当前表单覆盖值并回退存储/环境配置。
5. 新建路由局部客户端 `AiGenerationSettingsForm.tsx`：自由输入模型的 Combobox、拉取按钮、候选/错误状态、推理强度 Select、现有保存 action。
6. 精简 `src/app/admin/security/page.tsx` 的 AI 卡片为服务端数据加载 + 客户端表单 props；确保 API Key 不进入 props。
7. 扩展 `src/lib/model-import-ai.ts`：可选 `reasoningEffort` 进入配置并条件生成 `reasoning_effort`，保持既有 stream/tools/usage 契约。
8. 更新测试：
   - `tests/ai-settings.test.ts`：合法/空/非法推理强度和原有回退。
   - `tests/ai-settings-store.test.ts`：推理强度持久化与清空。
   - 新增模型列表 helper 测试：请求 URL/header、规范化、错误矩阵、不泄密。
   - `tests/model-import-ai.test.ts`：指定强度和默认不传两条请求体断言。
9. 运行针对性测试，再运行完整质量门与构建。

## Validation Commands

```powershell
npx tsx --test tests/ai-settings.test.ts tests/ai-settings-store.test.ts tests/openai-compatible-models.test.ts tests/model-import-ai.test.ts
npm run check
npm run build
git diff --check
```

## Review Gates

- 检查页面 props、action 返回值和错误文案不包含 API Key。
- 检查模型拉取失败不会改变受控模型输入。
- 检查自定义模型可在没有候选或不在候选中时提交。
- 检查默认推理强度序列化为 `null` 且请求体无 `reasoning_effort`。
- 检查现有生成 API DTO、stream 解析与 token metadata 测试无回归。

## Risk and Rollback Points

- 客户端 Combobox 与 FormData 集成是主要 UI 风险；若 Base UI 自由文本提交不稳定，保留受控状态并使用 hidden input 作为单一提交值。
- 外部模型列表响应存在供应商差异；MVP 只承诺 OpenAI-compatible `{ data: [{ id }] }`，其他结构安全报错并保留手工输入。
- 不触碰 schema/migration；若设置行为回归，可独立回退新增键而不影响数据库版本。
