# 技术设计

## 总体方案

使用 shadcn CLI 4.13.0 初始化当前默认 `base-nova` 预设和 neutral 语义主题，在 `src/components/ui/` 中生成项目拥有的基础 UI 组件。现有 `src/components/forms/` 继续作为 LDAPI 的表单组合层，领域表单和目录组件继续拥有业务状态。

迁移不改变信息架构、数据加载、请求负载或导航。页面布局继续使用 Tailwind utility class，但颜色、边框、表面、焦点和控件状态统一改用 shadcn 的 `background`、`foreground`、`card`、`muted`、`border`、`input`、`primary`、`destructive`、`ring` 等语义 token。

## 目录与所有权

```text
src/components/ui/       shadcn CLI 生成的基础组件，允许按项目需求小幅编辑
src/components/forms/    LDAPI 共享表单组合：字段、区块、提交栏
src/components/*.tsx     领域表单、目录、筛选和展示逻辑
src/app/**               路由页面、服务端数据加载和路由局部客户端编排
src/lib/utils.ts         shadcn `cn` 辅助函数
src/app/globals.css      Tailwind、shadcn 主题 token 和最小全局基础样式
```

不创建新的万能表单、页面 schema 或 CRUD 配置层。`components/ui` 不拥有中文文案、API URL、导航、删除语义或领域默认值。

## 初始化与主题

1. 使用固定版本 `npx shadcn@4.13.0 init --defaults`，避免 latest 漂移。
2. 检查 CLI 对 `package.json`、`components.json`、`src/app/globals.css` 和 `src/lib/utils.ts` 的变更。
3. 使用当前默认 neutral 视觉；删除暖色 canvas、珊瑚 primary、serif display 和 `ld-*` 控件变量/类。
4. 不实现主题切换器。CLI 生成的 `.dark` token 可以保留为标准主题能力，但本任务只启用默认浅色页面。
5. 保留必要的全局 `box-sizing`、字体平滑和 body 最小高度；页面宽度与布局用局部 Tailwind class 表达。

## 基础组件集合

首批安装：`button`、`input`、`textarea`、`field`、`card`、`badge`、`table`、`checkbox`、`separator`、`select`、`combobox`、`toggle-group`、`tabs`、`alert`、`alert-dialog`、`empty`。

只安装实际使用的组件。图标统一使用 `lucide-react`；下拉箭头、关闭、搜索等不再使用文本符号。

## 迁移边界

### 页面框架

- `src/app/page.tsx`、登录页和管理页改用 `bg-background`、`text-foreground`、`border-border`、`text-muted-foreground` 等语义类。
- 链接型命令使用 `Button` 的组合 API；普通内容链接使用语义文本样式，不强制包成按钮。
- 管理列表页使用 `Card`、`Table`、`Badge` 和 `Empty`，保留现有列、宽度下限和横向滚动。

### 共享表单组合

- `FormTextField` 组合 `Field`、`FieldLabel`、`Input` 和 `FieldDescription`，保持 unknown 到字符串的规范化。
- `FormSection` 保留 fieldset/legend 语义，并用 Card/Field 组合表达标题、说明和 muted 状态。
- `FormCheckboxGroup` 使用 shadcn Checkbox，但继续输出现有 `name`、`value` 和默认选中语义。
- `FormSubmitBar` 使用 Card/边框表面和 Button，保持 sticky、saving 和 disabled 行为。

### 交互控件

- `HomeTabs` 使用 `Tabs`，默认 tab 仍为站点，计数和内容条件保持不变。
- `FilterSelect` 和固定枚举选择器使用 `Select`。
- 开发者、图标、资源标签、站点模型等支持输入建议的控件使用 `Combobox`。领域组件继续决定过滤、创建新值和最终提交值。
- 筛选 chip 和离散多选使用 `ToggleGroup`；若某个选择必须保持原生 FormData 多值，使用受控状态加 hidden input 明确提交。
- 删除、停用和永久删除使用 `AlertDialog`，保留原文案、API URL、method 和成功导航。

## 服务端与客户端边界

- 页面和数据加载继续是服务端组件。
- Tabs、Select、Combobox、Checkbox、ToggleGroup、AlertDialog 等交互组件位于已有客户端边界内。
- 纯展示 UI 组件不应迫使整个页面变成客户端组件。若 CLI 生成的纯展示文件包含非必要客户端标记，可在确认无 Hook、浏览器 API 或客户端 primitive 后移除。
- 不把数据库记录、server-only 模块或路由逻辑移入 `components/ui`。

## 兼容性与回滚

- 迁移按“基础设施 -> 共享原语 -> 公开目录 -> 管理列表 -> 领域表单 -> 危险操作 -> 清理规范”顺序进行，每个阶段都可通过 git diff 独立审查。
- 在所有消费者迁移完成前不删除 `ld-*` 定义；最后通过 `rg "ld-" src` 确认无消费者后再清理。
- 若某个复杂 Combobox 迁移破坏提交语义，回滚该领域控件到原有状态，保留其他已完成的基础组件迁移，再单独修正其值适配层。

## Spec 更新

- 更新 `styling-and-accessibility.md`：shadcn 主题来源、语义 token、组件优先级、图标、焦点和响应式要求。
- 更新 `component-guidelines.md`：`components/ui` 与 `components/forms` 的所有权、shadcn 组合规则、服务端/客户端边界。
- 更新 `directory-structure.md`：补充 `src/components/ui/` 与 `src/lib/utils.ts`。
- 更新 `index.md` 的开发前检查和质量检查，明确可见 UI 修改需检查 shadcn 组件复用和旧类残留。
- 更新代码复用指南中“设计变量和通用控件”的所有者，避免继续指向旧 `ld-*` 体系。

## 验证

- 静态检查：`rg -n "ld-" src`、`rg -n "var\(--(canvas|primary|ink|hairline|surface-)" src`。
- 行为检查：现有表单 payload、筛选、认证和管理服务测试。
- 质量门：`npm run check`，之后 `npm run build`，最后 `git diff --check`。
- 浏览器检查：桌面和移动视口下验证公开目录、登录、管理列表、表单、下拉/组合框、Tabs、筛选 Toggle 和 AlertDialog；确保无重叠、溢出和不可见焦点。
