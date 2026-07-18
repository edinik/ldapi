# 日间夜间模式实施计划

## Ordered Checklist

1. 新增 `src/lib/theme.ts`，定义 `Theme`、`themeStorageKey`、存储值解析、主题解析和下一主题纯函数。
2. 新增 `tests/theme.test.ts`，覆盖合法/非法存储值、显式偏好优先级、系统主题回退和日夜互切。
3. 新增 `src/components/ThemeProvider.tsx`：
   - 提供 `resolvedTheme` 与 `toggleTheme()`；
   - 同步 `<html>.dark` 和 `color-scheme`；
   - 持久化显式偏好；
   - 仅在无显式偏好时响应系统主题；
   - 监听同源 `storage` 变化并清理 listeners；
   - 安全处理不可用的浏览器存储。
4. 新增 `src/components/ThemeToggle.tsx`，实现共享的 shadcn/lucide 图标按钮、动态无障碍名称和 `aria-pressed`。
5. 修改 `src/app/globals.css` 和 `src/app/layout.tsx`，用 CSS 系统主题 fallback 与 Provider layout effect 完成无脚本首屏收敛。
6. 将 ThemeToggle 接入公开页和登录页页头，保持现有响应式宽度与导航。
7. 将 ThemeToggle 接入全部管理页的现有 action group 或页头右侧，共 12 个管理页面入口。
8. 修改 `src/app/login/LoginForm.tsx`，让 Turnstile 等待已解析主题、按主题重建并清空旧 token。
9. 由登录页服务端查询 TOTP 是否启用，仅在启用时向 `LoginForm` 传递布尔状态并渲染必填验证码字段。
10. 运行针对性测试和类型检查，修复实现问题。
11. 运行完整质量门，并进行桌面/移动端浅色和深色视觉验证。

## Validation Commands

按顺序执行，避免 Next.js 与 TypeScript 同时重建 `.next/types`：

```powershell
npm test -- tests/theme.test.ts
npm run typecheck
npm run check
npm run build
git diff --check
```

视觉验证至少覆盖：

- 公开目录：浅色、深色、桌面、移动端，按钮与“管理入口”不重叠。
- 登录页：两种主题下 Card、输入框、错误 Alert、Turnstile 一致，切换后 widget 重建。
- 管理首页：操作按钮可换行且 ThemeToggle 不挤压主要动作。
- 代表性窄宽管理页（安全设置或备份）和编辑表单：页头按钮不遮挡内容或 sticky 提交栏。
- 未设置 `ldapi-theme` 时切换系统配色，页面自动响应；手动切换后再次改变系统配色，页面保持显式选择。
- 刷新时观察首屏无明显错误主题闪烁，控制台无 hydration 错误。

## Risky Files and Review Gates

- `src/app/layout.tsx` / `src/app/globals.css`：影响所有路由。检查无脚本告警，系统主题 fallback 与显式 class 优先级正确。
- `src/components/ThemeProvider.tsx`：重点检查 listener 生命周期、非法存储值和 localStorage 异常处理。
- `src/app/login/LoginForm.tsx`：重点检查主题重建后 token 清空，且原登录错误/成功流程不变。
- 14 个页面页头：逐一检查移动端 flex/wrap，不顺带改动业务按钮、链接目标或页面文案。

## Rollback Points

- 纯逻辑、Provider 和 Toggle 可作为一个独立回滚单元。
- 页面接入是机械性变更，可逐页撤回而不影响主题核心。
- Turnstile 同步可独立撤回到固定浅色，但完整功能验收要求它与页面主题一致。
- 无数据库、环境变量或依赖变更，不需要迁移回滚。

## Pre-start Gate

- [x] PRD 已完成收敛，无阻塞性开放问题。
- [x] 技术设计覆盖首屏防闪烁、存储契约、系统监听、无障碍和 Turnstile。
- [x] 实施计划列出全部页面接入、自动化测试和视觉验证。
- [x] 用户审核规划产物并明确批准开始实施。

## Validation Result

- `npm run check`：通过，103 个测试全部成功。
- `npm run build`：通过，Next.js 生产构建成功。
- `git diff --check`：通过。
- 本地数据库已按当前 Drizzle schema 全新初始化，默认管理员为 `admin / changeme`，TOTP 未启用。
- 登录页无 TOTP 字段，主题切换、持久化、动态无障碍名称和管理页接入已验证。
- 修复开发模式发现的 React 脚本节点、失效 Cookie 修改和 Base UI Link 按钮警告；新页面实时控制台 error 为 0。
