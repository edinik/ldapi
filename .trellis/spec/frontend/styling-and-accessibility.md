# 样式与无障碍

## 样式来源

- 全局主题 token 与 Tailwind 入口位于 `src/app/globals.css`。
- shadcn/ui 提供默认 neutral 语义主题（CSS variables），包括 `background`、`foreground`、`card`、`muted`、`border`、`input`、`primary`、`destructive`、`ring` 等。
- Tailwind 工具类负责路由或组件特有的布局与响应式行为。
- `src/app/layout.tsx` 设置中文文档语言、字体变量，并引入全局样式表。

共享颜色、表面、边框和焦点状态优先使用 shadcn 语义 token。新增可见控件前，先复用 `src/components/ui/` 中的 shadcn 原语，再组合 `src/components/forms/`。

## 日间与夜间主题

- 主题契约由 `src/lib/theme.ts` 拥有。存储键固定为 `ldapi-theme`，仅接受 `light` / `dark`；缺失或非法值跟随 `prefers-color-scheme`。
- `ThemeProvider` 同步 `<html>` 的 `.light` / `.dark` class 和 `color-scheme`。无显式偏好时响应系统变化，手动切换后写入明确偏好。
- `globals.css` 中的 `prefers-color-scheme: dark` 为尚未 hydration 且没有 `.light` 的首屏提供深色 token；Provider 使用 layout effect 在首个客户端绘制前收敛显式偏好。
- 不要在根布局渲染内联 `<script>` 或 `next/script` 主题初始化节点。Next.js 16 + React 19 的开发热刷新会报告 `Encountered a script tag while rendering React component`。
- 主题按钮复用 `ThemeToggle`，必须使用 shadcn Button、lucide 图标、动态无障碍名称和 `aria-pressed`。页面只负责把它放入现有页头操作区。
- 登录 Turnstile 接收 Provider 的明确 `light` / `dark` 值；主题变化时重建 widget 并清空旧 token。

测试至少覆盖存储值校验、系统 fallback 和下一主题计算。可见修改结束后，在浅色/深色及桌面/移动端检查页头位置，并确认浏览器控制台没有 hydration、脚本或 Base UI 错误。

## 组件样式

- 全站使用 shadcn/ui neutral 日间/夜间语义主题；不维护旧暖色 canvas、珊瑚 primary 或 editorial serif 视觉 token。
- 图标统一使用 `lucide-react`，不要用文本符号充当下拉箭头或关闭按钮。
- 页面宽度与布局用局部 Tailwind class 表达；不要重新引入已删除的 `ld-*` 控件类。
- 组件响应式行为使用明确的工具类。除非任务要求布局变化，抽取组件时不要修改断点。
- 只有多个组件需要同一稳定视觉契约，且 shadcn 原语无法表达时，才新增项目级布局约定。

参考：`src/app/globals.css`、`src/components/ui/`、`src/app/page.tsx`、`src/app/admin/page.tsx` 和各目录组件。

## 表单

- 每个 label 与控件必须通过匹配的 `htmlFor` 和 `id` 关联，参考 `FormTextField.tsx`。
- 表单内非提交按钮必须声明 `type="button"`。
- 通过 `FormSubmitBar` 和 `Button` 的 disabled 状态保留 saving 行为。
- 约束或后果使用帮助文本说明，不要把 placeholder 当作唯一标签。
- 非原生控件提交时，使用 hidden input 或领域状态明确 FormData / payload 语义。

## 自定义控件

- 优先使用 shadcn `Select`、`Combobox`、`Tabs`、`ToggleGroup`、`Checkbox`、`AlertDialog` 等交互原语。
- 若领域表单保留轻量建议列表，也应公开展开状态和列表语义，并保持键盘可达。
- 使用 shadcn 焦点环保持键盘焦点可见。
- 保持稳定触摸目标；用图标替换文本时不得缩小交互区域。
- 扩展交互控件时同时测试键盘和指针交互；ARIA 属性不能替代焦点管理。

## 禁止做法

- 不要重新引入 `ld-button-*`、`ld-input`、`ld-card*`、`ld-badge*`、`ld-table`、`ld-filter-*` 等旧控件类。
- 不要在单个页面中创建第二套按钮、输入框或徽章系统。
- 视觉重构时不要移除标签、焦点轮廓、按钮类型或 ARIA 状态。
- 不要把旧暖色 / 珊瑚色 / serif 主题变量重新映射到 shadcn token。
