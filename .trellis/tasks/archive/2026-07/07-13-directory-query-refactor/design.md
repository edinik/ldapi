# 目录查询与展示边界重构设计

## Proposed Modules

```text
src/server/directory/
  get-home-directory-data.ts
  projections.ts
  types.ts
```

如拆分后单文件更清晰，可按 site/model/resource 分文件；不为了目录形式增加空壳层。

## Data Flow

```text
requireAdmin
  -> getHomeDirectoryData(db)
     -> query active sites + siteModels + models
     -> query models
     -> query active resources
     -> pure projections
  -> { sites, models, resources }
  -> HomeTabs
```

## Projection Ownership

- model projection：解析 reasoning effort，并保持 `ModelDisplayItem` 契约。
- site projection：解析站点模型能力 override、价格设置和评分，生成 `SiteDirectoryItem`。
- resource projection：规范 type、解析 tags，并生成资源目录 DTO。

这些函数不访问数据库，因此能用固定 fixtures 做精确行为测试。

## Query Ownership

查询服务接受可注入 `AppDb`。查询顺序和排序条件保持现状；是否内部并行执行只在不影响 SQLite 行为和测试确定性的前提下决定。

## Authentication

页面继续在加载数据前调用 `requireAdmin`。认证策略通过第一阶段建立的稳定测试边界验证，不再读取 `page.tsx` 源码。

## Compatibility / Risks

- DTO 漏字段：测试比较完整对象，并让组件 props 类型成为编译期门禁。
- null/override 语义变化：复用现有 normalization helpers，不重新实现规则。
- 排序变化：查询测试明确断言站点、模型、资源顺序。
- 页面意外先查询后认证：页面结构保持认证调用在查询服务之前。
