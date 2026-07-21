# Implement — 公开目录 Anime.js 动效 MVP

## Checklist

### 1. 依赖与基础

- [ ] `npm i animejs`
- [ ] 新增 `src/lib/motion.ts`（tokens、`prefersReducedMotion`、`playCardGridEnter`、`playMatchCountPulse`、cancel WeakMap）
- [ ] `src/app/globals.css`：CSS variables（duration/ease）、`@media (prefers-reduced-motion: reduce)`、`tab-in` / `empty-in` keyframes（如采用 CSS）

### 2. 目录卡片入场 + 匹配数

- [ ] `SiteDirectory.tsx`：grid/count ref、`data-motion`、animationKey effect、Card hover class
- [ ] `ResourceDirectory.tsx` + `ResourceSection`：双 section 各自入场；匹配数 pulse
- [ ] `ModelOverview.tsx`：同构入场 + hover（若有匹配计数则 pulse）

### 3. Tab / 主题 / Empty

- [ ] `HomeTabs.tsx` 或 `ui/tabs.tsx`：TabsContent 入场动画 class（不破坏 Tabs 行为）
- [ ] `ThemeToggle.tsx`：日月图标过渡
- [ ] Empty 节点淡入 class / data-motion

### 4. 验证

- [ ] 手工：站点/资源/模型筛选、搜索连敲、清除筛选、Tab、主题、reduced-motion
- [ ] `npm run check`
- [ ] `npm run build`

## Validation Commands

```bash
npm run check
npm run build
```

## Risky Files / Notes

| 文件 | 风险 |
|------|------|
| `SiteDirectory.tsx` / `ResourceDirectory.tsx` / `ModelOverview.tsx` | effect 依赖漏项导致不播或狂播 |
| `ui/tabs.tsx` | 改 shadcn 原语可能影响后台 Tabs |
| `globals.css` | reduced-motion 过度 `!important` 可能误伤 |

**建议**：Tab 动画优先只在 `HomeTabs` 的 `TabsContent` 加 class，尽量不改通用 `ui/tabs.tsx`。

## Rollback Points

1. 装完依赖未改业务组件前：可直接卸载包。
2. 每改完一个 Directory 组件：可单独回退该文件验证筛选仍正确。

## Out of Order Guards

- 先 `motion.ts` + globals，再接组件。
- 不要在 Server Component 中 import animejs。
