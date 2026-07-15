# 组件规范

## 服务端与客户端组件

- 页面和数据组合优先使用服务端组件。只有需要 Hook、浏览器 API、受控输入或事件交互时才添加 `"use client"`。
- 把规范化后的 DTO 传给交互组件。目录组件消费 `SiteDirectoryItem`、`ModelDisplayItem` 和 `DirectoryResource`，而不是原始 Drizzle 行。
- 仅组件内部使用的 props 类型放在组件附近；跨层共享的形状应导入其唯一 DTO 定义。
- 纯展示 shadcn 组件不应迫使整个页面变成客户端组件。交互原语（Tabs、Select、Combobox、Checkbox、ToggleGroup、AlertDialog）放在已有客户端边界内。

参考文件：

- `src/app/page.tsx`
- `src/components/HomeTabs.tsx`
- `src/server/directory/projections.ts`
- `src/server/directory/types.ts`

## UI 原语与共享表单组合

| 层级 | 目录 | 职责 |
|---|---|---|
| shadcn 基础原语 | `src/components/ui/` | Button、Input、Card、Badge、Table、Select 等可组合 UI |
| 表单组合 | `src/components/forms/` | 与领域无关的字段、区块、复选框组和提交栏 |
| 领域组件 | `src/components/*Form.tsx` 等 | 业务状态、默认值、确认文案、提交适配 |

重复的表单结构使用现有原语：

```tsx
<FormSection title="基础信息">
  <FormTextField name="name" label="名称" required defaultValue={data.name} />
</FormSection>
<FormSubmitBar saving={saving} idleLabel="保存" />
```

- `FormSection` 拥有重复的区块框架、标题、描述和 muted 变体。
- `FormTextField` 拥有标签/输入关联，以及 unknown 默认值到字符串的转换。
- `FormCheckboxGroup` 拥有重复的复选框布局，不拥有领域能力规则；继续通过 `name` / `value="on"` 兼容 FormData。
- `FormSubmitBar` 只拥有保存中的视觉状态，不拥有提交或导航逻辑。
- 领域表单继续拥有无法由通用原语表达的编辑器和业务默认值，参考 `SiteForm.tsx`、`ModelForm.tsx` 和 `ResourceForm.tsx`。
- `components/ui` 不拥有中文文案、API URL、导航、删除语义或领域默认值。

## 提交边界

- 表单组件收集 UI 状态。
- `src/lib/admin/forms/` 下的纯序列化器拥有 JSON 负载。
- 路由局部的客户端封装拥有 URL、method、确认行为、成功导航和实体特有错误处理。
- `requestJson` / `useJsonMutation` 只拥有传输和 pending 生命周期。
- 删除 / 停用 / 永久删除使用 `ConfirmAction`（基于 `AlertDialog`），保留原文案和请求目标。

这一分层可参考 `EditModelClient.tsx`、`model-form-payload.ts` 和 `use-json-mutation.ts`。

## 抽取规则

只有结构和行为重复且稳定时才抽取共享组件。仅外观相似或领域规则不同的实现应保持局部。不要创建配置驱动的万能 CRUD 表单。

## 禁止做法

- 不要用大型 schema 或配置 DSL 替换清晰的领域 JSX。
- 抽取共享组件时不要顺带改变输入默认值；应先用负载测试锁定现有语义。
- 不要把路由导航、确认对话框、软删除或硬删除规则塞进通用 UI 原语。
- 已有投影层时，不要把原始数据库记录直接传入客户端组件。
