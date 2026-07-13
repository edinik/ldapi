# 目录查询与展示边界重构

## Goal

将首页目录的数据查询、领域转换和展示 DTO 从页面组件中拆分，使页面结构更易读、领域转换可复用且可直接测试。

## Background

- `src/app/page.tsx` 同时承担认证、三类数据库查询、模型能力/价格解析、资源标签解析、DTO 构造和页面渲染。
- 该文件是最近 30 次提交中变更最频繁的业务文件，新增字段通常需要在页面中继续扩展映射逻辑。
- 现有 `tests/page-auth.test.ts` 通过读取页面源码验证认证调用，容易被安全的内部重构破坏。

## Requirements

- 建立目录查询服务，集中读取首页需要的站点、模型和资源数据。
- 将站点、模型和资源的数据库记录到展示 DTO 的转换拆为纯投影函数。
- 站点模型能力继承、reasoning levels、价格标签和资源标签必须保持现有结果。
- `src/app/page.tsx` 只负责编排认证、加载数据和渲染 `HomeTabs`。
- 保持首页 UI、排序、筛选输入、DTO 字段和认证要求不变。
- 用行为测试覆盖投影边界和认证策略，移除页面源码正则测试。
- 复用第一阶段确定的 `src/server`、数据库注入和质量命令约定。
- 不修改数据库 schema、API 或目录组件视觉结构。

## Acceptance Criteria

- [x] `src/app/page.tsx` 不再直接导入 `db`、Drizzle 查询操作符或价格/能力/标签转换函数。
- [x] 查询服务返回 `HomeTabs` 所需的完整 typed DTO。
- [x] 站点、模型、资源投影均有纯函数测试，覆盖 null、override、价格和标签等关键边界。
- [x] 页面认证不再依赖源码文本测试，仍保证认证失败时不会加载目录数据。
- [x] 首页站点、模型、资源的排序、数量、筛选和展示内容与重构前一致。
- [x] `npm run typecheck`、`npm test`、`npm run lint`、`npm run build` 均成功。

## Dependencies

- 推荐在 `07-13-admin-crud-refactor` 完成后实施，以复用其 `src/server` 目录、`AppDb` 类型和质量脚本约定。

## Out of Scope

- 管理端 CRUD 和表单重构。
- 首页视觉改版、缓存策略、分页、搜索 API 或性能专项优化。
