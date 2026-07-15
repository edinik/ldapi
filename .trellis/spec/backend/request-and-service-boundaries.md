# 请求与服务边界

## 运行时流程

```text
Route Handler / Server Action
  -> 认证和请求解析
  -> 纯负载规范化
  -> 实体服务或查询服务
  -> Drizzle / 外部集成
  -> 明确的 JSON、redirect 或渲染 DTO
```

## Route Handler

`src/app/api/**/route.ts` 拥有 HTTP 行为：

- 决定路由是公开还是需要认证；
- 读取 `NextRequest`、path params 和 JSON；
- 调用归属的规范化函数和服务；
- 使用 `NextResponse` 保持 status code 和响应形状。

站点、模型、资源和导入的写路由在写入前调用 `requireAuth()`。不要推断所有 GET 都是私有接口；应明确保留当前路由策略。

参考：`src/app/api/models/route.ts`、`src/app/api/resources/[id]/route.ts` 和 `src/app/api/models/import/route.ts`。

## Server Action

`src/app/admin/security/actions.ts` 展示了 Server Action 边界：认证、读取 `FormData`、执行小型安全/设置操作，然后通过明确的结果 query redirect。浏览器专属行为不应进入 action。

被多个路由共享的实体 CRUD 属于 `src/server/admin/`，而不是 Server Action 或 Route Handler。

## 应用服务

- `src/server/admin/*.ts` 拥有实体持久化和关系协调。
- 服务接收 `AppDb`，生产传入 `db`，测试传入 SQLite 数据库。
- 保持实体差异显式。模型停用、硬删除、资源删除和站点模型同步不是一个通用 CRUD 契约。
- `src/server/directory/` 拥有共享公开目录查询和投影流程。
- 投影函数保持纯函数，不访问数据库。

## 规范化

- 不可信 JSON 或表单值必须先解析，再进入持久化。
- 复用其所有者解析器：`model-payload.ts`、`resource-payload.ts`、`site-model-payload.ts` 或 `ai-settings.ts`。
- 保留“缺失”和“空值”的区别。例如，`updateSite` 只有在请求提供模型字段时才同步关联。
- 已有边界辅助函数能够拥有字段时，不要重复写内联 cast。

## 错误与兼容性

- 重构时保持当前中文错误文案和 HTTP status 稳定。
- 外部失败在路由边界转换。AI 生成路由把上游集成失败转换为 `502`。
- 除非服务契约明确返回结果联合类型，否则不要在通用服务中隐藏错误。
- 保持认证顺序。`loadAuthenticatedDirectory` 的存在使测试能够证明先认证、后加载。

## 禁止做法

- 不要在 Route Handler 中嵌入重复的 Drizzle 写入链。
- 不要创建抹平实体差异的万能 repository。
- 不要让展示投影或格式化泄漏进持久化服务。
- 不要把所有失败都转换成 `200` 或泛化异常；应保留现有边界契约。
