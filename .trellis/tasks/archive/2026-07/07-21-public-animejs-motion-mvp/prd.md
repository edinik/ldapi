# 公开目录 Anime.js 动效 MVP

## Goal

为 LDAPI 公开首页（站点 / 模型 / 资源三目录）增加克制、可扫读的动效反馈，强化筛选结果变化与主题切换的体感，不改变任何业务数据与筛选逻辑。

## Background

- 产品形态是工具型导航站，不是营销落地页；动效必须服务「筛选反馈」与「状态变化」。
- 公开页核心交互集中在 `HomeTabs` + `SiteDirectory` / `ModelOverview` / `ResourceDirectory`。
- 仓库已有 Tailwind、`tw-animate-css`、shadcn 过渡；本任务引入 **animejs（v4）** 仅用于需要 stagger / cancel 编排的场景。
- 用户已确认：依赖选 animejs；范围按动效规格 MVP 落地。

## Confirmed Facts

- 技术栈：Next.js App Router、React 19、客户端目录组件（`"use client"`）。
- 站点筛选：`SiteDirectory` — query / 能力 chip（单多选）/ 模型 select。
- 资源筛选：`ResourceDirectory` — query / 类型 / 标签 chip。
- 模型筛选：`ModelOverview` — 搜索 / 能力 / 排序（与卡片网格同模式）。
- Tab 切换：`HomeTabs` + shadcn `Tabs`。
- 主题切换：`ThemeToggle` + `ThemeProvider`。
- 全局样式入口：`src/app/globals.css`（含 `tw-animate-css`）。
- 无障碍：必须尊重 `prefers-reduced-motion`；不得破坏现有 focus / aria。

## Requirements

### R1 — 依赖与运动工具

- 安装 `animejs`，仅按需 import（`animate`、`stagger` 等），不整包无脑塞进每个页面。
- 抽取共享运动辅助（建议 `src/lib/motion.ts`）：duration / ease / stagger cap、`prefersReducedMotion()`、`playCardGridEnter()`、`playMatchCountPulse()`。
- 在 `globals.css` 定义 motion token（fast/normal/slow、ease、distance）及 reduced-motion 全局降级。

### R2 — 卡片网格筛选后入场（站点 / 资源 / 模型）

- 筛选结果变化后，可见卡片以 fade + 轻微上移入场。
- 参数：`opacity 0→1`，`translateY 6px→0`，`duration 220ms`，`stagger 40ms`，最多前 12 张错开，之后同步。
- 搜索输入对「入场动画」debounce **150ms**；chip / select / 清除筛选立即触发。
- 连续快速筛选必须 cancel 上一次动画，避免叠播。
- 不实现 exit FLIP / 飞走删除。

### R3 — 匹配数量反馈

- `匹配 N / M` 中的 `N` 变化时轻 scale pulse（`1 → 1.08 → 1`，约 180ms）。
- 数字不变时不播；用 transform，不改 font-size 造成布局抖。

### R4 — Tab 内容切换

- `HomeTabs` 切换站点/模型/资源时内容区 crossfade（opacity，可选 `translateY 4px`，约 220ms）。
- 不做大幅水平滑动。

### R5 — 空状态

- 筛选无匹配 / 全库为空的 Empty 容器淡入（约 220ms），不循环 bounce。

### R6 — CSS 微交互

- 目录卡片 hover：`translateY(-2px)` + shadow，150ms；`motion-reduce` 下禁用位移。
- `ThemeToggle` 日月图标切换旋转/淡入淡出（约 280–320ms）。
- 筛选 chip 可选 `active:scale-[0.97]`；清除筛选按钮出现时可 fade-in。

### R7 — 无障碍与兼容

- `prefers-reduced-motion: reduce` 时 JS 与 CSS 动画均接近瞬时终态。
- 不改变筛选语义、单/多选行为、链接、键盘可达性、SSR 卡片内容。
- 深色/浅色下 hover 与对比度仍可读。

## Out of Scope

- 后台管理表格 / 表单大套动效。
- 滚动视差、整页 story、无限 loop。
- Framer Motion / 其他动画库。
- Header logo 首屏入场（可选后续）。
- 卡片 exit layout 动画、拖拽弹簧、SVG 花活。

## Acceptance Criteria

- [ ] AC1：公开三目录在筛选变化后，卡片有统一 stagger 入场；搜索连敲不叠动画、不卡顿。
- [ ] AC2：匹配数变化有一次轻 pulse；不变不播。
- [ ] AC3：Tab 切换有短 crossfade，无硬切感。
- [ ] AC4：Empty 状态淡入；清除筛选后列表恢复并入场。
- [ ] AC5：卡片 hover 与 ThemeToggle 微交互在 light/dark 正常。
- [ ] AC6：系统开启 reduced-motion 时近乎无动画。
- [ ] AC7：筛选逻辑与单/多选行为与改前一致；`npm run check` 通过；`npm run build` 通过。
- [ ] AC8：animejs 为按需 import；公开页无新增 console 错误 / hydration 警告。

## Technical Notes

- 动效仅 client；目录数据仍 SSR/服务端拉取。
- 建议 DOM 标记：`data-motion="card-grid" | "card" | "match-count" | "empty"`。
- filter 指纹 `filterKey` 驱动入场；搜索与动画 debounce 解耦实现细节见 `design.md`。

## Open Questions

无阻塞项。实现细节（hook 命名、是否抽 `useCardGridEnter`）由 design 决定，不阻塞开工。
