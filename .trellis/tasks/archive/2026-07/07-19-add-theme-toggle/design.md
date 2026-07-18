# 日间夜间模式技术设计

## Architecture

该功能保持在前端浏览器边界内，不新增依赖、数据库字段或 API。

```text
RootLayout
  ├─ CSS prefers-color-scheme fallback
  └─ ThemeProvider (client boundary, layout effect)
       ├─ ThemeToggle（14 个页面页头复用）
       └─ LoginForm -> themed Turnstile
```

建议新增以下所有者：

- `src/lib/theme.ts`：主题常量、存储值校验、主题解析和下一主题计算等纯逻辑。
- `src/components/ThemeProvider.tsx`：浏览器状态、媒体查询监听、根元素同步和 `localStorage` 持久化。
- `src/components/ThemeToggle.tsx`：唯一的可访问图标按钮。
- `src/app/globals.css`：首屏系统主题 fallback。
- `src/app/layout.tsx`：Provider 挂载。

页面继续保持服务端组件；只有 Provider、Toggle 和现有 LoginForm 位于客户端边界。

## Theme Contract

```ts
type Theme = "light" | "dark";
const themeStorageKey = "ldapi-theme";
```

- `parseThemePreference(value)` 仅接受 `light` / `dark`，其他值返回 `null`。
- `resolveTheme(preference, systemPrefersDark)` 优先显式偏好，否则解析系统主题。
- `getNextTheme(current)` 始终返回相反主题。
- 根元素以 `.dark` 作为 CSS 主题开关；浅色主题不添加主题 class。
- 同步设置 `document.documentElement.style.colorScheme`，让浏览器原生表单和滚动条匹配当前主题。

## Initial Theme Rendering

根布局不渲染 `<script>`，避免 Next.js 16 / React 19 在开发热刷新时把脚本节点视为不可执行的客户端脚本。

- `globals.css` 使用 `prefers-color-scheme: dark` 为没有 `.light` 显式 class 的首屏提供完整深色 token 和 `color-scheme`。
- ThemeProvider 使用 `useLayoutEffect` 在浏览器绘制前读取合法的 `localStorage` 偏好、解析系统主题并添加明确的 `.light` 或 `.dark` class。
- `<html suppressHydrationWarning>` 保留；服务端不渲染依赖浏览器状态的主题文案，避免 hydration 不一致。
- 已保存偏好与系统主题相反时，layout effect 会在首个客户端绘制前覆盖 CSS 系统 fallback。

## Provider Data Flow

Provider 暴露：

```ts
interface ThemeContextValue {
  resolvedTheme: Theme | null;
  toggleTheme(): void;
}
```

- mount 时读取合法显式偏好并计算当前主题，然后再次同步根元素，保证状态与首屏脚本一致。
- 无显式偏好时注册 `prefers-color-scheme` change listener；事件触发时重新解析并应用主题。
- 同时监听 `storage` 事件，使同一浏览器的其他标签页更改能够同步；清除或写入非法值时恢复系统解析。
- `toggleTheme()` 以 Provider 状态为准；尚未收敛时从根元素 `.dark` 读取当前显示主题，再计算下一主题。
- 手动切换先写入合法显式偏好，再同步 DOM 和 React 状态。若 `localStorage` 不可用，仍更新当前页面，但无法承诺跨刷新持久化。
- effect cleanup 移除媒体查询和 storage listener。

## Accessible Toggle Contract

- 使用 `Button variant="outline" size="icon" type="button"`。
- 浅色时显示 Moon 图标并命名为“切换至夜间模式”；深色时显示 Sun 图标并命名为“切换至日间模式”。
- 使用 `aria-pressed` 表达深色模式是否启用；Provider 尚未收敛时省略该布尔状态并使用中性名称“切换日间或夜间模式”。
- 图标声明为装饰性；按钮保留 shadcn 的焦点环和现有触摸目标。
- 不在每个页面复制事件处理、存储或图标逻辑。

## Page Integration

ThemeToggle 接入以下 14 个页头位置：

1. `src/app/page.tsx`：与“管理入口”组成右侧 action group。
2. `src/app/login/page.tsx`：卡片品牌行右侧。
3. `src/app/admin/page.tsx`：现有管理操作按钮组。
4. `src/app/admin/backup/page.tsx`：返回链接/标题区域右上角。
5. `src/app/admin/security/page.tsx`：返回链接/标题区域右上角。
6. `src/app/admin/models/page.tsx`：现有操作按钮组。
7. `src/app/admin/models/new/page.tsx`：页头右上角。
8. `src/app/admin/models/import/page.tsx`：页头右上角。
9. `src/app/admin/models/[id]/edit/page.tsx`：页头右上角。
10. `src/app/admin/resources/page.tsx`：现有操作按钮组。
11. `src/app/admin/resources/new/page.tsx`：页头右上角。
12. `src/app/admin/resources/[id]/edit/page.tsx`：页头右上角。
13. `src/app/admin/sites/new/page.tsx`：页头右上角。
14. `src/app/admin/sites/[id]/edit/page.tsx`：页头右上角。

窄屏页头允许操作区自然换行，不采用 fixed/floating 定位，也不改变现有页面宽度和业务操作顺序。

## Turnstile Synchronization

`LoginForm` 从 ThemeProvider 读取 `resolvedTheme`：

- 主题尚未解析时暂不挂载 Turnstile，避免先创建错误主题 widget。
- 解析后把明确的 `light` / `dark` 传给 Turnstile `options.theme`。
- 使用解析主题作为 widget key，使主题改变时 React 卸载旧 widget 并挂载新 widget。
- theme effect 清空 `turnstileTokenRef`，避免重建后提交旧 token。
- 现有成功、错误和登录提交流程保持不变。

## Login TOTP Visibility

登录页服务端组件仅查询管理员 `totpSecret` 是否存在，并把 `requiresTotp: boolean` 传给 `LoginForm`。客户端不接收密钥：

- `requiresTotp=false` 时不渲染 TOTP 字段。
- `requiresTotp=true` 时渲染 TOTP 字段并声明 `required`。
- API 继续拥有最终认证校验，UI 条件显示不替代后端安全边界。

## Compatibility and Failure Handling

- 依赖标准 `classList`、`localStorage` 和 `matchMedia`；目标浏览器与当前 Next.js 应用一致。
- 对旧浏览器的 MediaQueryList listener 可在实现时兼容 `addEventListener` / `removeEventListener`，如当前类型和目标浏览器需要。
- 读取存储失败时不阻塞页面渲染；使用系统主题或浅色回退。
- 不执行数据迁移。非法旧值会被忽略，但不必主动删除。

## Trade-offs

- 选择项目内 Provider 和首屏脚本，而不是引入 `next-themes`。当前只需要两个主题和一个存储键，自包含实现能避免新依赖与安装风险；代价是需要自行维护一小段首屏和媒体查询逻辑。
- 不加入第三个“系统”按钮状态，保持二态切换简洁；用户未手动选择前仍完整支持系统跟随。
- 在每个现有页面页头显式放置同一组件，以尊重各页布局；不新增可能影响移动端表单的全局悬浮层。

## Rollback

回滚时删除 Provider、Toggle、纯主题辅助函数和页面接入，恢复 `layout.tsx` 与 `LoginForm`。没有数据库或配置迁移，回滚后遗留的 `localStorage` 值不会影响旧版本。
