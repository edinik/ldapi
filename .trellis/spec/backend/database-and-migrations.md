# 数据库与迁移

## 数据库归属

- `src/db/schema.ts` 是 Drizzle schema 的事实来源。
- `src/db/types.ts` 导出共享 `AppDb` 类型。
- `src/db/index.ts` 打开 `data/sqlite.db` 并导出生产 `db`。
- `drizzle/*.sql` 与 `drizzle/meta/_journal.json` 是部署启动程序使用的迁移历史。
- `tests/test-db.ts` 把迁移 SQL 应用到内存 SQLite，用于服务和查询测试。

## 服务签名

数据库服务显式接收数据库实例：

```ts
export async function createResource(database: AppDb, data: ResourceWrite) {
  const [resource] = await database.insert(resources).values(data).returning();
  return resource;
}
```

- 行类型和写入类型使用 `typeof table.$inferSelect` 和 `$inferInsert` 推导。
- 导入 `AppDb`，不要重复定义 `BetterSQLite3Database<typeof schema>` 别名。
- 只在生产边界传入全局 `db`；测试传入自己的数据库。

## SQLite 运行规则

- `src/db/index.ts` 在非 `next build` 阶段为生产运行时启用 WAL。
- 构建期模块收集阶段不要启用 WAL；多个 Next worker 可能竞争数据库。
- 持久化文件为 `data/sqlite.db`。代码、文档、Docker mount 和维护脚本必须使用同一路径。
- 外键行为影响 `site_models` 级联删除及 session/user 关系。关系变更必须在开启外键的环境中测试。

## 迁移流程

- 修改 `src/db/schema.ts` 后，使用现有 Drizzle script 生成新的追加式迁移，并提交 SQL 与 journal metadata。
- 不得修改已经部署的迁移来表达新变化。
- Docker bootstrap 按 journal 顺序读取条目，用 `--> statement-breakpoint` 分割 SQL，在 transaction 中应用迁移，并把 tag 记录到 `__ldapi_migrations`。
- `tests/test-db.ts` 当前显式列出迁移文件名。新增或重命名迁移时必须同步更新列表，让测试覆盖生产 schema 顺序。
- 迁移语句必须兼容 `scripts/docker-bootstrap.mjs`。其幂等处理可规范化表/索引创建并容忍重复列，但不能替代合法迁移。

## 查询与投影规则

- 筛选和排序属于查询服务。`getHomeDirectoryData()` 拥有站点、模型和资源的 active filter 与顺序。
- 存储字符串和覆盖值在纯投影或领域辅助函数中转换，不要在渲染时转换。
- 修改查询时，在数据库测试中断言排序和 active/inactive 行为。

## 禁止做法

- 可接收 `AppDb` 的可复用服务不得导入生产 `db`。
- `tests/test-db.ts` 可以应用真实迁移时，不要在测试中手写一份重复 schema。
- 不要并发运行 build 和独立 typecheck；Next 会重建 `.next/types`。
- 不要只在一个运行表面修改数据库文件路径。
