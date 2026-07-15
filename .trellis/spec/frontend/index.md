# 前端开发规范

本层适用于 App Router 页面、React 组件、浏览器端辅助函数、表单、样式和无障碍交互。

## 规范索引

| 规范 | 适用场景 |
|---|---|
| [目录结构](./directory-structure.md) | 确定页面、组件、表单序列化器和客户端辅助函数的归属 |
| [组件规范](./component-guidelines.md) | 服务端/客户端边界、共享表单原语和领域组件 |
| [Hook 规范](./hook-guidelines.md) | 小型客户端 Hook 和可测试的传输辅助函数 |
| [状态管理](./state-management.md) | 服务端数据、本地 UI 状态和派生集合 |
| [样式与无障碍](./styling-and-accessibility.md) | shadcn 主题 token、组件优先级、响应式行为和无障碍控件 |
| [类型安全](./type-safety.md) | FormData、浏览器负载、DTO 和规范化后的客户端契约 |

## 开发前检查

- 新建或移动前端模块前，阅读 `directory-structure.md`。
- 修改 React 或表单代码时，阅读 `component-guidelines.md` 和 `state-management.md`。
- 新增自定义 Hook 或请求封装前，阅读 `hook-guidelines.md`。
- 修改可见 UI 时，阅读 `styling-and-accessibility.md`，优先复用 `src/components/ui/` 与 `src/components/forms/`。
- 修改表单、API 负载或展示 DTO 时，阅读 `type-safety.md`。
- 涉及 Route Handler、Server Action、数据库或认证时，同时阅读 `../backend/index.md`。
- 新增或修改测试前，同时阅读 `../testing/index.md`。
- 改动跨越 UI、API、服务和存储时，阅读 `../guides/cross-layer-thinking-guide.md`。

## 质量检查

- 除非任务明确要求改变，否则保留现有字段名、默认值、确认文案、导航目标和响应式布局。
- 检查键盘焦点、标签关联、按钮类型和自定义控件的 ARIA 状态。
- 可见 UI 修改后，搜索是否误用旧 `ld-*` 控件类，以及是否优先复用 shadcn 组件。
- 按 `../testing/test-patterns.md` 的要求，先运行 `npm run check`，结束后再运行 `npm run build`。

项目规范正文使用中文。面向用户的应用文案默认继续使用中文，除非产品需求另有规定。
