# 迁移前端样式至 shadcn/ui

## Goal

将 LDAPI 的前端样式和通用交互组件迁移到 shadcn/ui 体系，减少 `globals.css` 中项目自建的 `ld-*` 控件样式，并让后续页面优先复用可组合、可访问、类型安全的共享 UI 组件。

迁移应保持现有业务行为、中文文案、导航目标、服务端/客户端组件边界和响应式信息架构不变；视觉主题改为 shadcn/ui 默认 neutral 风格，不保留当前暖色 editorial 主题。

## Background

- 项目使用 Next.js 16 App Router、React 19、TypeScript、Tailwind CSS 4。
- 当前未安装 shadcn/ui，也没有 `components.json`。
- 全局样式入口为 `src/app/globals.css`，其中定义暖色设计变量以及按钮、输入框、卡片、徽章、表格、筛选器等 `ld-*` 类。
- `src/app` 和 `src/components` 中约有 200 处 `ld-*` 使用和 573 处 `className`；迁移影响公开目录、登录页、管理页、领域表单和目录筛选组件。
- `FilterSelect.tsx`、`SiteForm.tsx`、`ModelForm.tsx` 和 `ResourceForm.tsx` 包含手写 listbox/combobox 交互，需要评估以 shadcn/ui 对应组件替换，而不只是换 CSS 类。
- 现有前端规范明确要求优先使用 `ld-*` 类，因此迁移完成后必须同步更新 `.trellis/spec/frontend/`。

## Requirements

- 初始化适配 Tailwind CSS 4 和现有 `@/*` 路径别名的 shadcn/ui 配置。
- 使用 shadcn/ui 默认 neutral 主题、默认圆角和语义颜色变量，不继续映射当前暖色、珊瑚色和 editorial serif 视觉 token。
- 建立项目共享 UI 组件目录和 `cn` 等必要基础设施，组件实现遵循 shadcn/ui 的可组合模式。
- 用 shadcn/ui 组件替换通用按钮、输入框、文本域、标签、卡片、徽章、表格、复选框、分隔线和选择/弹出类控件。
- 用 shadcn/ui 对话框替换浏览器原生删除/停用确认框，同时保留现有确认文案、取消语义和请求目标。
- 领域组件继续拥有业务状态和业务规则，不引入配置驱动的万能表单或万能 CRUD 组件。
- 删除不再使用的 `ld-*` 控件类；仅保留确有项目级语义且 shadcn/ui 不负责的布局或品牌排版约定。
- 保持现有字段名、默认值、确认行为、提交方式、URL、成功导航、错误处理和展示数据契约。
- 保持现有中文文案、响应式布局层级、键盘可达性、焦点可见性、标签关联和 ARIA 语义。
- 更新前端 spec，使其以 shadcn/ui 组件、语义主题 token 和共享组件归属作为样式层规范，不再要求优先复用已删除的 `ld-*` 控件类。
- 不修改后端 API、数据库 schema、认证规则或业务数据模型，除非迁移所需的类型修复无法在前端边界内解决。

## Acceptance Criteria

- [x] 项目包含有效的 shadcn/ui 配置，且新增依赖与 Next.js 16、React 19、Tailwind CSS 4 兼容。
- [x] 全站视觉已切换为 shadcn/ui 默认 neutral 主题，不再依赖当前暖色、珊瑚色和 editorial serif 主题变量。
- [x] 公开目录、登录页、管理列表页、管理表单页和安全设置页均使用新的共享 UI 原语。
- [x] 通用控件不再直接依赖 `ld-button-*`、`ld-input`、`ld-label`、`ld-card*`、`ld-badge*`、`ld-table`、`ld-filter-*` 等旧控件类。
- [x] 手写选择/弹出控件迁移后保持鼠标和键盘交互，并具有正确的展开、选中、焦点和列表语义。
- [x] 删除、停用和永久删除操作使用 shadcn/ui 确认对话框，原有确认文案和 API 请求保持不变。
- [x] 现有业务操作、字段默认值、表单负载、确认文案和导航目标保持不变。
- [ ] 页面在移动端和桌面端无明显溢出、遮挡、布局跳动或文本截断回归。
- [x] `.trellis/spec/frontend/` 已更新，明确 shadcn/ui 的使用、组件所有权、主题 token、禁止做法和质量检查要求。
- [x] `npm run check` 与 `npm run build` 通过。

## Out of Scope

- 后端、数据库、认证和业务规则重构。
- 与样式迁移无关的信息架构或产品功能改版。
- 将领域表单改造成 schema/配置驱动系统。
- 引入暗色模式，除非用户明确将其纳入本次任务。
