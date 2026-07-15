# 实施计划

## 1. 初始化 shadcn/ui

- [x] 记录迁移前 `package.json`、`globals.css` 和 git 状态。
- [x] 运行 `npx shadcn@4.13.0 init --defaults`，使用 CSS variables 和当前默认 neutral 预设。
- [x] 审查 `components.json`、依赖、`src/lib/utils.ts` 和全局 CSS，修正路径或重复基础样式。
- [x] 添加实际组件：button、input、textarea、field、card、badge、table、checkbox、separator、select、combobox、toggle-group、tabs、alert、alert-dialog、empty。
- [x] 运行 typecheck，确认基础设施可编译。

## 2. 迁移共享表单原语

- [x] 迁移 `FormTextField`、`FormSection`、`FormCheckboxGroup`、`FormSubmitBar`。
- [x] 保留 fieldset/legend、label/id、默认值、name/value、saving/disabled 和 FormData 语义。
- [x] 运行 `tests/admin-form-payloads.test.ts` 与 typecheck。

## 3. 迁移全局页面与公开目录

- [x] 迁移 root layout、首页页框架、登录页面和登录表单。
- [x] 将 `HomeTabs` 改为 shadcn Tabs。
- [x] 将 `FilterSelect` 改为 shadcn Select。
- [x] 迁移 `SiteDirectory`、`ModelOverview`、`ResourceDirectory` 的筛选区、卡片、Badge、空状态和按钮。
- [x] 保持筛选纯函数、默认 tab、结果排序和清空行为。
- [x] 运行目录筛选、展示和认证相关测试及 typecheck。

## 4. 迁移管理列表与安全设置

- [x] 迁移 `/admin`、模型列表、资源列表的页面头部、统计 Card、Table、Badge 和 Empty。
- [x] 迁移新增/编辑/导入页面外壳与安全设置表单。
- [x] 保留服务端页面边界、表格列、导航目标、Server Action 和表单字段。
- [x] 运行认证、AI 设置和管理服务相关测试及 typecheck。

## 5. 迁移领域表单

- [x] 迁移 `ModelForm`：Developer/Icon Combobox、Type Select、Checkbox、Textarea 和区块。
- [x] 迁移 `ResourceForm`：类型选择、标签 Combobox/chips、Textarea 和区块。
- [x] 迁移 `SiteForm`：MiniSelect、能力覆盖、推理强度、价格编辑器、模型 Combobox 和危险操作按钮。
- [x] 对非原生控件显式验证 hidden input / FormData 输出，必要时在领域组件保留值适配层。
- [x] 运行全部 payload、价格、能力和选项测试及 typecheck。

## 6. 迁移确认对话框与清理旧体系

- [x] 用 AlertDialog 替换站点、资源、模型停用和永久删除的 `window.confirm`。
- [x] 保留确认文案、请求 URL、method、hard delete 参数和成功导航。
- [x] 在确认所有消费者已迁移后删除 `ld-*` 类和旧暖色主题变量。
- [x] 搜索旧类、旧 CSS 变量、文本下拉箭头和浏览器原生 confirm 残留。

## 7. 更新规范

- [x] 更新 frontend `styling-and-accessibility.md`、`component-guidelines.md`、`directory-structure.md` 和 `index.md`。
- [x] 更新通用代码复用指南中通用 UI 所有者描述。
- [x] 确认规范正文为中文，引用真实文件和实际组件，不保留旧 `ld-*` 指令。

## 8. 完整验证

- [x] 运行 `npm run check`。
- [x] 运行 `npm run build`。
- [x] 运行 `git diff --check`。
- [ ] 启动开发服务器，使用桌面和移动视口验证公开目录、登录、管理列表、管理表单和交互控件。
- [ ] 检查键盘焦点、Tabs、Select、Combobox、ToggleGroup、Checkbox、AlertDialog、文本换行、横向表格滚动和按钮 loading/disabled 状态。
- [x] 修复所有发现后重复完整质量门。

## 风险文件与回滚点

- `src/app/globals.css`：CLI 与旧主题的交叉修改最多；先保留旧定义，最后统一清理。
- `src/components/SiteForm.tsx`：领域状态和提交语义最复杂；完成其他表单后再迁移。
- `src/components/ModelForm.tsx`、`ResourceForm.tsx`：自由输入 Combobox 需验证自定义值。
- `src/components/ui/*`：CLI 生成代码属于项目源码，但修改应局限于兼容性和服务端边界，不做无关重写。
- 任一复杂控件出现语义回归时，回滚该控件的单独迁移，不回退已验证的主题和基础原语。
