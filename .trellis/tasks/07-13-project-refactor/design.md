# 项目重构总体设计

## Design Goals

- 以维护成本和后续开发速度为首要优化目标。
- 保持 UI、API 路径与负载、数据库 schema 和现有业务行为兼容。
- 通过小步、可测试、可回滚的子任务推进，不做全量重写。

## Target Boundaries

```text
Admin form UI
  -> entity form serializer
  -> shared JSON mutation client
  -> existing Route Handler contract
  -> entity-specific admin service
  -> Drizzle / SQLite

Home page
  -> directory query service
  -> pure entity projections
  -> typed display DTOs
  -> HomeTabs / directory components
```

### Shared UI Boundary

只提取三类表单中稳定重复的结构：表单分区、文本字段、复选项组和底部提交栏。模型选择、标签编辑、价格编辑等领域组件保留在各自表单中。

### Client Mutation Boundary

共享客户端能力负责 JSON 请求、pending 生命周期和一致的成功/失败结果。路由目标、确认文案和成功跳转仍由实体页面配置，避免形成包含业务规则的万能 hook。

### Admin Service Boundary

Route Handlers 保留 HTTP 责任：认证、读取 URL/JSON、保持现有状态码与响应形状。站点、模型、资源服务分别拥有 Drizzle 写操作；不创建通用 repository interface。数据库参数可注入，以便使用内存 SQLite 做行为测试。

### Directory Boundary

目录查询服务负责读取站点、模型和资源。纯投影函数负责把数据库记录转换为 `SiteDirectoryItem`、`ModelDisplayItem` 和资源 DTO，包括站点模型能力、价格与标签解析。页面组件只组合最终数据。

## Testing Strategy

- 为表单序列化器和目录投影编写纯函数测试。
- 为实体服务使用内存 SQLite 验证创建、更新、删除及站点模型同步。
- 将登录、登出和页面认证的源码正则测试替换为稳定的策略/处理器行为测试；不再依赖 import 顺序或解构文本。
- 在 `package.json` 增加统一的 `test`、`typecheck` 和组合检查脚本。
- ESLint 只覆盖产品源码和项目配置，忽略 Trellis/agent 运行时目录，避免工具代码阻断产品质量门。

## Compatibility

- 不修改现有 URL、HTTP method、JSON 字段、成功响应或错误文案。
- 不修改 Drizzle schema 或迁移文件。
- 不改变表单布局、字段名称、默认值、确认文案和成功跳转。
- 内部类型可以收紧，但边界仍接收当前调用方发送的负载。

## Trade-offs

- 不引入表单库：当前问题可由小型共享组件和纯序列化函数解决，引入框架会扩大迁移面。
- 不建立通用 CRUD 仓储：三个领域的删除、关联和校验行为不同，通用层会隐藏差异。
- 先处理管理端再处理首页：先建立可复用目录和测试约定，降低第二阶段设计漂移。

## Rollback

- 两个子任务分别提交并验收；任一阶段可独立回滚。
- 抽取时先增加共享模块和测试，再逐个迁移调用方；每迁移一个实体运行针对性测试。
- 不包含 schema 迁移，因此回滚不需要数据恢复。
