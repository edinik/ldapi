# Design — 公开目录 Anime.js 动效 MVP

## Architecture

```
globals.css (tokens + reduced-motion + tab/empty CSS)
        │
src/lib/motion.ts  ── animejs (animate, stagger)
        │
        ├─ SiteDirectory.tsx
        ├─ ResourceDirectory.tsx
        ├─ ModelOverview.tsx
        ├─ HomeTabs.tsx / tabs (CSS enter)
        └─ ThemeToggle.tsx (CSS only)
```

- **业务逻辑零改动**：filter 函数、state 形状、API 不变。
- **表现层叠加**：ref + effect / 纯 CSS class。
- **边界**：所有 animejs 调用只在 `"use client"` 组件或 client-only lib 中；`motion.ts` 不得在 Server Component 顶层执行 DOM API。

## Module: `src/lib/motion.ts`

```ts
export const motion = {
  duration: { fast: 150, normal: 220, slow: 320, pulse: 180 },
  ease: { out: "outExpo", inOut: "inOutQuad" },
  staggerMs: 40,
  staggerCap: 12,
  distance: { card: 6, hover: 2, tab: 4 },
  searchDebounceMs: 150,
} as const;

export function prefersReducedMotion(): boolean;

/** Cancel previous run on same root; set initial opacity/transform; animate cards. */
export function playCardGridEnter(root: ParentNode | null): void;

export function playMatchCountPulse(el: HTMLElement | null): void;
```

### `playCardGridEnter` 行为

1. `root` 为 null → no-op。
2. 查询 `[data-motion="card"]`；无节点 → no-op。
3. `prefersReducedMotion()` → 直接 `opacity:1; transform:none`。
4. 若 root 上挂有进行中的 anime instance → `pause` / cancel（animejs v4 对应 API）。
5. 置初态 `opacity:0; translateY(6px)`。
6. `animate(cards, { opacity, translateY, duration: 220, ease: 'outExpo', delay: (_, i) => Math.min(i, 11) * 40 })`。
7. 将 animation handle 存到 `WeakMap<ParentNode, Animation>` 便于 cancel。

### `playMatchCountPulse`

- reduced-motion → no-op。
- `scale: [1, 1.08, 1]`，duration 180ms，`inOutQuad`。
- 不读写 textContent。

## Component Integration

### Directory components（三处同构）

| 组件 | filterKey 组成 | 网格 | 匹配数 |
|------|----------------|------|--------|
| `SiteDirectory` | `query\|caps\|model` | `filteredSites` grid | `filteredSites.length` |
| `ResourceDirectory` | `query\|type\|tags` | 各 `ResourceSection` grid 或外层容器 | `filteredResources.length` |
| `ModelOverview` | 与现有 filter/sort state 对齐 | 模型卡片 grid | 若有匹配文案则挂 pulse |

模式：

```tsx
const gridRef = useRef<HTMLDivElement>(null);
const countRef = useRef<HTMLSpanElement>(null);
const filterKey = ...;
const isSearchOnlyChange = ...; // 可选：仅搜索时 debounce

useEffect(() => {
  const delay = /* search-driven ? 150 : 0 */;
  const id = window.setTimeout(() => {
    playCardGridEnter(gridRef.current);
    playMatchCountPulse(countRef.current);
  }, delay);
  return () => clearTimeout(id);
}, [filterKey]);
```

**搜索 debounce 策略（推荐）**：

- 维护 `listFilterKey`（立即用于 filter useMemo，保证列表即时或同样 150ms——**列表过滤保持即时**，仅动画 debounce）。
- 另维护 `animationKey`：非 search 字段立即等于 filterKey；search 字段 150ms 后同步。
- effect 依赖 `animationKey` + `filtered.length`。

资源页有两个 section 网格时：

- 方案 A：每个 section 各自 `ref` + enter（推荐，stagger 更自然）。
- 方案 B：外层容器 `querySelectorAll('[data-motion=card]')` 一次播。

采用 **A**：`ResourceSection` 接收 `animationKey` 或内部 ref + 父级传入的 `playToken`。

### `HomeTabs` / Tabs

- 优先 CSS：`TabsContent` 挂载时 `tab-in` keyframes（opacity + optional 4px Y）。
- 不引入 animejs 到 Tab，避免与卡片入场双重拖慢；进入 Tab 后由目录组件自身 mount/filter effect 播卡片。

### `ThemeToggle`

- 纯 CSS：Moon/Sun absolute 叠放，`scale/opacity/rotate` + `dark:` 变体，duration ~300ms。
- 保持现有 `aria-label` / `aria-pressed`。

### 卡片 hover

- Tailwind class 追加在三处 Card 上（或抽 `directoryCardClassName` 常量于 `motion.ts` / 小组件）。
- `motion-reduce:transition-none motion-reduce:hover:translate-y-0`。

### Empty

- `data-motion="empty"` + CSS `empty-in` 或 `animate-in fade-in`（tw-animate）。

## Dependency

```bash
npm i animejs
```

- 类型：animejs v4 自带类型则直接用；否则再评估 `@types`（预计不需要）。
- bundle：仅 client 组件 import，避免进 RSC 图。

## Compatibility

| 项 | 策略 |
|----|------|
| SSR | 动画 effect 仅在 client；首屏可无动画或 mount 后播一次 |
| Hydration | 不在服务端写 inline opacity:0；初态在 effect 内设置（接受首帧后动画）或用 CSS 默认可见 + effect 重播——**优先 effect 内设初态再 animate**，避免 SSR HTML 永久 opacity:0 |
| 筛选逻辑 | 不改 `filterSites` / `filterResources` / `filterModels` |
| 单多选 | 不改 ToggleGroup 行为 |

**首帧闪烁取舍**：effect 内先藏再显，可能有 1 帧全量显示。可接受；若明显，再用 `animationKey` 变化时加 `isAnimating` class 隐藏，但复杂度更高——MVP 接受 effect 方案。

## Trade-offs

| 决策 | 选择 | 原因 |
|------|------|------|
| animejs vs 纯 CSS stagger | animejs | cancel + cap + 统一 API |
| 列表即时 vs 动画 debounce | 列表即时、动画 150ms | 输入反馈与动效不打架 |
| 无 exit 动画 | 是 | 卡片高度不一，FLIP 易抖 |
| Tab 用 CSS | 是 | 足够且更轻 |

## Rollback

1. 卸载 animejs 依赖。
2. 删除 `src/lib/motion.ts` 与组件内 ref/effect/data-motion。
3. 还原 ThemeToggle / Card className / globals 中 motion 块。
4. 筛选功能应完全回到改前行为。

## Testing

- 单元：`prefersReducedMotion` 可在 jsdom 中 mock `matchMedia`（可选小测）。
- 手工：三目录筛选、搜索连敲、Tab、主题、reduced-motion、light/dark。
- 命令：`npm run check` → `npm run build`。
