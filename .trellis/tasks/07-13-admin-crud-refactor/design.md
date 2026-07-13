# 管理端表单与 CRUD 重构设计

## Proposed Modules

```text
src/components/forms/
  FormSection.tsx
  FormTextField.tsx
  FormCheckboxGroup.tsx
  FormSubmitBar.tsx

src/lib/admin/forms/
  form-data.ts
  site-form-payload.ts
  model-form-payload.ts
  resource-form-payload.ts

src/lib/admin/json-mutation.ts

src/server/admin/
  sites.ts
  models.ts
  resources.ts
```

最终文件名可在实现时按现有命名微调，但边界不变。

## Form Design

- `FormSection` 支持现有 title、description 和 muted 变体。
- `FormTextField` 兼容 unknown 默认值、helper、step、required 等当前并集。
- `FormCheckboxGroup` 支持数据字段默认值和显式 `defaultChecked`。
- `FormSubmitBar` 只负责 sticky 容器、disabled 和标签，不拥有提交逻辑。
- 每个实体序列化器接收 `FormData` 及实体特有受控状态，输出当前 API 负载；不创建动态 schema DSL。

## Client Request Design

共享 mutation 层提供 JSON 请求和 pending 生命周期，返回明确的成功/失败结果。编辑页面保留删除确认、软删/硬删区别与 router 跳转，因此业务规则不会藏入通用层。

## Server Service Design

- `models.ts`：create、update、soft delete、hard delete。
- `resources.ts`：create、update、delete。
- `sites.ts`：create、update、delete，并协调站点模型同步。
- 服务函数接受 `AppDb`，Route Handler 传入生产 `db`，测试传入内存 SQLite。
- `syncSiteModels` 改为显式接收数据库实例，避免隐藏全局依赖。

HTTP 认证、参数读取、现有校验和 `NextResponse` 仍位于 Route Handler。

## Test Design

- serializer tests：用构造的 `FormData` 验证精确输出。
- service tests：为各实体创建最小内存 schema，验证写入、更新时间、删除和关联同步。
- mutation tests：mock fetch，验证 method、headers、body 和失败结果。
- auth tests：测试提取后的登录策略/处理器与登出行为，不断言源码文本。

## Quality Configuration

- 在 `package.json` 增加 `test`、`typecheck` 和组合脚本。
- ESLint ignore 增加 `.agent/**`、`.agents/**`、`.claude/**`、`.codex/**`、`.pi/**`、`.trellis/**`，产品代码警告单独评估，不修改工具生成代码。

## Risks

- 表单默认值差异被共享组件抹平：用现有字段逐项快照式行为测试防护。
- 站点模型同步依赖全局 db：先参数化，再迁移服务调用。
- 通用 mutation 隐藏实体差异：只共享传输和 pending，不共享确认/跳转/删除语义。
