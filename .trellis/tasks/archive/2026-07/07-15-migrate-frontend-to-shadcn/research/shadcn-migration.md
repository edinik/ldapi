# shadcn/ui 迁移研究

## 版本与项目适配

- 2026-07-15 查询 npm registry，`shadcn` 最新稳定版为 `4.13.0`。
- 项目使用 Next.js 16.2.9、React 19.2.4、Tailwind CSS 4 和 `@/* -> ./src/*` 路径别名，CLI 能识别这些现有配置。
- `shadcn init --defaults` 当前默认参数是 `--template=next --preset=base-nova`。本任务采用该当前默认预设，并使用 CSS variables。
- 当前默认样式入口会引入 `tw-animate-css` 和 `shadcn/tailwind.css`，并为 `body`、边框和 focus ring 建立语义 token。
- registry 组件根据选择的预设安装其底层依赖；常见依赖包括 `class-variance-authority`、`lucide-react`、`radix-ui` 或 `@base-ui/react`，CLI 负责选择与写入准确版本。

## 现有样式覆盖面

- `src/app/globals.css` 当前包含约 280 行项目自定义主题和 `ld-*` 控件类。
- `src/app` 与 `src/components` 约有 200 处 `ld-*` 使用、573 处 `className`。
- 高频旧类包括 `ld-badge`、`ld-input`、`ld-label`、`ld-display`、`ld-card-light`、`ld-link`、`ld-button-primary` 和 `ld-button-secondary`。
- 最大迁移文件为 `SiteForm.tsx`、`ModelForm.tsx`、三个公开目录组件及管理端安全设置页。

## 组件映射

| 现有模式 | shadcn/ui 目标 |
|---|---|
| `ld-button-*`、链接按钮 | `Button` 及其 default / outline / destructive / ghost / link variant |
| `ld-input`、原生 textarea | `Input`、`Textarea` |
| `ld-label`、帮助文本 | `Field`、`FieldLabel`、`FieldDescription` |
| `ld-card*`、表单区块 | `Card` 家族；语义 fieldset 保留时组合 `FieldSet` / `FieldLegend` |
| `ld-badge*` | `Badge` variants，必要时只增加项目语义 variant 名，不保留旧类 |
| `ld-table` | `Table` 家族 |
| 原生 checkbox | `Checkbox`，保留 `name`、`value`、`defaultChecked` 和 FormData 语义 |
| `HomeTabs` 手写 tab | `Tabs` |
| 固定枚举下拉 | `Select` |
| 可输入建议下拉 | `Combobox` |
| 多选筛选 chip | `ToggleGroup` / `ToggleGroupItem` |
| 空数据状态 | `Empty` |
| 登录错误 | `Alert` |
| 删除和停用确认 | `AlertDialog` |
| 区块分隔 | `Separator` |

## 风险与验证重点

- shadcn 复选框和组合框不是简单的原生标签替换，必须验证 FormData 中的字段名、多值和空值语义。
- `SiteForm` 的 nullable 覆盖值、价格编辑器和模型关联是领域状态，迁移只能替换控件外壳，不能改写业务状态模型。
- Combobox 需要同时支持自由输入和选项选择；若 registry 组件的提交行为不符合现有负载，应通过领域组件中的 hidden input 明确提交值。
- shadcn 组件源码归项目所有。纯展示组件若带来不必要的客户端边界，可以在不改变公开 API 的前提下移除无用的 `use client`，但交互组件必须保留客户端边界。
- 当前样式规范与迁移目标直接冲突，必须在同一任务中更新，避免未来代码重新引入 `ld-*`。

## 验证策略

- 使用现有 payload/filter 单元测试证明业务数据语义未变。
- 运行 `npm run check`、`npm run build` 和 `git diff --check`。
- 启动本地开发服务器，检查公开目录、登录页及可访问的管理页面在桌面和移动视口的布局、焦点、下拉、标签页、筛选和确认对话框。
