# 样式与无障碍

## 样式来源

- 全局设计变量和可复用 `ld-*` 类位于 `src/app/globals.css`。
- Tailwind 工具类负责路由或组件特有的布局与响应式行为。
- `src/app/layout.tsx` 设置中文文档语言并引入全局样式表。

共享颜色和表面优先使用现有 CSS 变量，包括 `--canvas`、`--surface-card`、`--surface-dark`、`--primary`、`--ink`、`--muted`、`--hairline` 和语义状态色。新增等价样式前，先复用 `ld-container`、`ld-card`、`ld-button-primary`、`ld-button-secondary`、`ld-input`、`ld-focus-ring` 等既有类。

## 组件样式

- 保留当前暖色画布、深色表面、珊瑚色主操作和细边框视觉语言。
- 保持共享控件尺寸稳定：现有按钮和输入框最小高度为 `2.75rem`，圆角为 `8px`。
- 使用现有容器规则，不要创建第二套页面宽度约定。
- 组件响应式行为使用明确的工具类。除非任务要求布局变化，抽取组件时不要修改断点。
- 只有多个组件需要同一稳定视觉契约时才新增全局 `ld-*` 类；一次性布局使用局部 Tailwind 类。

参考：`src/app/globals.css`、`src/app/page.tsx`、`src/app/admin/page.tsx` 和各目录组件。

## 表单

- 每个 label 与控件必须通过匹配的 `htmlFor` 和 `id` 关联，参考 `FormTextField.tsx`。
- 表单内非提交按钮必须声明 `type="button"`。
- 通过 `FormSubmitBar` 和既有按钮样式保留 disabled 与 saving 状态。
- 约束或后果使用帮助文本说明，不要把 placeholder 当作唯一标签。

## 自定义控件

- 自定义选择器应公开展开状态和列表语义。`FilterSelect.tsx` 使用 `aria-haspopup="listbox"`、`aria-expanded`、`role="listbox"`、`role="option"` 和 `aria-selected`。
- 使用现有 focus ring 保持键盘焦点可见。
- 保持稳定触摸目标；用图标替换文本时不得缩小交互区域。
- 扩展自定义控件时同时测试键盘和指针交互；ARIA 属性不能替代焦点管理。

## 禁止做法

- 已有 CSS 变量表达相同角色时，不要新增硬编码重复颜色。
- 不要在单个页面中创建第二套按钮或输入框系统。
- 视觉重构时不要移除标签、焦点轮廓、按钮类型或 ARIA 状态。
- 不要假定 `DESIGN.md` 比实际实现更权威；应在 `globals.css` 和组件中核对变量与类。
