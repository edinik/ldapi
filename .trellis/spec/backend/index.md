# 后端开发规范

本层适用于 Route Handler、Server Action、应用服务、数据库访问、认证、配置和外部集成。

## 规范索引

| 规范 | 适用场景 |
|---|---|
| [请求与服务边界](./request-and-service-boundaries.md) | HTTP/Server Action 归属、规范化、服务和投影 |
| [数据库与迁移](./database-and-migrations.md) | Drizzle schema、`AppDb`、SQLite 行为、迁移和测试数据库 |
| [认证与外部集成](./authentication-and-integrations.md) | Session、TOTP、Turnstile、密钥、AI 配置和 fetch 边界 |

## 开发前检查

- 修改 Route Handler、Server Action 或 `src/server/` 前，阅读 `request-and-service-boundaries.md`。
- 修改 schema、查询、迁移或数据库初始化前，阅读 `database-and-migrations.md`。
- 修改登录、session、安全设置、环境变量或外部请求时，阅读 `authentication-and-integrations.md`。
- 阅读 `../testing/index.md`，确定所需测试形态。
- 配置或数据库行为影响 Docker/部署时，阅读 `../operations/index.md`。
- 字段跨越请求、服务、数据库、投影和 UI 时，阅读 `../guides/cross-layer-thinking-guide.md`。

## 质量检查

- 除非需求明确改变，否则保留现有 URL、method、status、JSON、redirect、cookie 和数据库契约。
- 修改 schema 字段、环境变量或序列化值时，搜索所有读取方和写入方。
- 先运行针对性测试，再运行 `npm run check`，结束后顺序运行 `npm run build`。
