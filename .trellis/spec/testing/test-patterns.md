# 测试模式

## 测试栈

- 使用 Node test runner：从 `node:test` 导入 `describe` / `it`。
- 使用 `node:assert/strict` 断言。
- TypeScript 测试通过 `npm test` 中的 `tsx --test tests/*.test.ts` 运行。
- 测试文件直接位于 `tests/`，按所覆盖行为或模块命名。

## 选择最窄且可信的边界

### 纯函数

解析器、序列化器、筛选器、价格逻辑、投影、TOTP 辅助函数和配置解析使用精确输入/输出断言。

参考：

- `tests/admin-form-payloads.test.ts`
- `tests/site-model-pricing.test.ts`
- `tests/resource-directory-filter.test.ts`
- `tests/ai-settings.test.ts`

覆盖会影响存储或展示值的正常、空/null、无效和规范化场景。

### 依赖注入编排

行为依赖框架或外部服务时，抽取策略并注入依赖。`tests/login-totp-route.test.ts`、`logout-route.test.ts` 和 `page-auth.test.ts` 在不导入 Next request/cookie 内部实现的情况下测试认证行为。

fetch 集成应注入或替换 fetcher，并断言 URL、method、header、body、响应解析和失败行为。参考 `tests/model-import-ai.test.ts` 与 `tests/turnstile.test.ts`。

### SQLite 集成

依赖真实 schema 或迁移的服务和查询使用 `tests/test-db.ts`。

```ts
const { database, sqlite } = createTestDb();
try {
  // Arrange、执行，并通过 Drizzle/SQLite 断言。
} finally {
  sqlite.close();
}
```

- 测试数据库开启外键。
- 跨实体行为使用真实迁移 SQL，不要手工重建 schema。
- 在 `finally` 中关闭 SQLite。
- 按场景断言持久化行、关系替换/级联、active filter 和排序。

若测试不依赖完整迁移契约，小型独立 store 可以像 `ai-settings-store.test.ts` 一样局部创建最小表。

## 行为优先于源码文本

不要读取实现文件后断言 import 顺序、函数名或代码片段。这类测试会在无害重构时失败，也可能在未证明行为时通过。

允许读取作为契约的文件，例如 `tests/test-db.ts` 应用迁移 SQL。

## 回归范围

- 新增纯边界：使用精确规范化输出的直接单元测试。
- 新增数据库写入/查询：使用 `AppDb` 注入的 SQLite 集成测试。
- 认证或顺序策略：使用依赖注入测试证明顺序和结果。
- 跨层字段：在每个有意义的转换处测试输入规范化、持久化、查询/投影和最终 DTO。
- 重构：保持 UI/API/schema 行为，并把依赖实现文本的断言替换为行为断言。

## 质量命令

```powershell
npm run typecheck
npm test
npm run lint
npm run build
```

`npm run check` 按顺序运行 typecheck、测试和 lint。只在 `check` 完成后运行 `npm run build`。不要并发运行 build 和独立 typecheck，因为 Next.js 会重建 `.next/types`，可能短暂缺失生成模块。

同时运行 `git diff --check`，并区分既有 warning 与新失败。

## 禁止做法

- 可以直接调用的纯函数不要 mock。
- 测试不得使用生产 `data/sqlite.db`。
- 不要遗留未关闭的数据库句柄。
- 非预期行为变化发生后，不要通过削弱精确契约断言让测试通过。
