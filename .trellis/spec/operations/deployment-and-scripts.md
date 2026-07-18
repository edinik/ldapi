# 部署与脚本

## 生产形态

- `next.config.ts` 设置 `output: "standalone"`。
- `Dockerfile` 使用依赖、构建和运行三个 stage。
- 运行镜像复制 `.next/standalone`、`.next/static`、`public`、`drizzle` 和 Docker bootstrap 脚本。
- 容器内服务监听 `3000`，`HOSTNAME=0.0.0.0`。
- `docker-compose.yml` 绑定 `127.0.0.1:${APP_PORT:-3000}`，并 mount `./data:/app/data`。

新增运行时资源时，必须确认 standalone 镜像显式复制该资源。builder stage 中存在的文件不会自动进入 runner stage。

## 启动契约

`scripts/docker-entrypoint.sh`：

1. 确保 `/app/data` 存在；
2. 缺少 `ADMIN_PASSWORD` 时拒绝启动；
3. 运行 `scripts/docker-bootstrap.mjs`；
4. 通过 `exec "$@"` 用应用进程替换自身。

保持脚本兼容 POSIX `sh`。Dockerfile 会规范化 CRLF 并设置可执行权限。

## Bootstrap 迁移与管理员初始化

- `docker-bootstrap.mjs` 打开 `/app/data/sqlite.db`、启用 WAL、事务化应用 journal 迁移、记录已应用 tag，并在用户不存在时创建配置的管理员。
- Bootstrap 每次容器启动都会运行，因此必须保持幂等。
- `ADMIN_USERNAME` 默认 `admin`；`ADMIN_PASSWORD` 必填，不得替换为不安全的生产默认值。
- 正常 bootstrap 不覆盖已有账号。
- 迁移变化必须与 `drizzle/meta/_journal.json` 和 `../backend/database-and-migrations.md` 保持一致。

## 环境变量

`.env.example` 是纳入版本控制的配置清单。当前分组：

- 运行时/端口：`APP_PORT`；
- 初始管理员：`ADMIN_USERNAME`、`ADMIN_PASSWORD`；
- 可选 Turnstile：`NEXT_PUBLIC_TURNSTILE_SITE_KEY`、`TURNSTILE_SECRET_KEY`；
- 可选 OpenAI-compatible 导入：`AI_BASE_URL`、`AI_API_KEY`、`AI_MODEL`。

浏览器公开变量必须使用 `NEXT_PUBLIC_`；密钥必须留在服务端。构建期需要的变量应像当前 Turnstile site key 一样通过 Docker build arg 传递；运行时需要的变量必须确认部署表面确实转发。

## 数据与备份

- `data/sqlite.db` 是持久化应用状态，运行时通过 bind mount 排除在镜像层之外。
- 迁移或服务器搬迁前备份 `data/`。
- 代码变更不得提交或覆盖用户数据。
- 代码、Docker、脚本、README 和部署文档必须使用相同数据库文件名和 mount。

## 场景：管理员下载 SQLite 备份

### 1. Scope / Trigger

- 当管理端需要在应用运行期间生成可恢复的 SQLite 文件时，使用本契约。
- 运行时启用 WAL，直接复制 `data/sqlite.db` 可能遗漏已提交到 `-wal` 的页面，因此必须使用 SQLite 在线备份 API。

### 2. Signatures

- HTTP：`POST /api/backup`。
- 服务：`createDatabaseBackup({ sourcePath, now?, tempRoot? }): Promise<{ contents: Buffer; filename: string }>`。
- 路径：`src/db/database-path.ts` 拥有生产 `data/sqlite.db` 的运行时路径，数据库连接和备份服务共同复用。

### 3. Contracts

- 请求 JSON：`password: string`；当前管理员启用 TOTP 时还需要 `totpCode: string`。
- API 必须先验证 session，再验证当前 session 所属管理员的密码和可选 TOTP；请求不能指定用户 ID。
- 成功响应为 `application/vnd.sqlite3` attachment，包含 UTC 文件名、`Cache-Control: private, no-store, max-age=0` 和 `Pragma: no-cache`。
- 备份保留 schema 和持久数据，但清空副本中的 `sessions`；源库 session 不变。
- 生产环境只允许 HTTPS。该功能不新增环境变量，不持久化服务端备份历史。

### 4. Validation & Error Matrix

| 条件 | 结果 |
|---|---|
| 缺失/无效 session | `401`，不进入备份流程 |
| 请求字段缺失或生产环境非 HTTPS | `400` |
| 密码或必需 TOTP 错误 | `403` |
| 在线备份、session 清理或 `PRAGMA integrity_check` 失败 | `500` 通用错误，不返回部分文件 |
| 成功 | `200` SQLite attachment，临时目录已清理 |

### 5. Good / Base / Bad Cases

- Good：WAL 源库仍在提供服务时，在线备份包含已提交数据，下载副本完整且 session 为空。
- Base：未启用 TOTP 的管理员使用有效 session 和密码下载备份。
- Bad：重复认证失败、非 HTTPS 或完整性检查失败时，不生成可下载文件，也不遗留临时副本。

### 6. Tests Required

- 认证单元测试断言：缺失 session、错误密码、TOTP 未启用、TOTP 缺失/错误/正确。
- 文件级 SQLite 测试断言：WAL 数据进入副本、业务和设置数据保留、副本 session 为空、源 session 保留、完整性为 `ok`。
- 失败测试断言：副本净化失败后唯一临时目录为空。
- HTTP 辅助测试断言：生产 HTTPS 判断、attachment 文件名和 no-store header。
- 完成前顺序运行 `npm run check`、`npm run build` 和 `git diff --check`；测试不得读取或覆盖真实用户数据库。

### 7. Wrong vs Correct

错误：

```ts
await copyFile("data/sqlite.db", destination);
```

这可能遗漏 WAL 页面；若在副本仍为 WAL 模式时清空 session 后只读取主文件，还可能把 session 留在下载内容中。

正确：

```ts
await sourceDatabase.backup(snapshotPath);
snapshotDatabase.pragma("journal_mode = DELETE");
snapshotDatabase.prepare("DELETE FROM sessions").run();
assertIntegrity(snapshotDatabase.pragma("integrity_check"));
```

所有连接在读取前关闭，唯一临时目录在 `finally` 中删除。

## 维护脚本

- `scripts/seed.ts` 在本地 `data/sqlite.db` 创建管理员，不覆盖已有用户名。
- `scripts/reset-password.ts` 是具有硬编码现有行为的手工应急脚本。不得在启动时自动调用，也不得在生产流程复用其默认密码。
- 打开 SQLite 的脚本必须关闭句柄。
- TypeScript 运行时可用时优先导入共享 schema/password 辅助函数；standalone bootstrap 保持自包含 JavaScript，因为它运行在最小镜像中。

## 文档权威顺序

运维事实按以下顺序判断：Dockerfile 与 Compose、entrypoint/bootstrap 脚本、`.env.example`、README/docs。历史排障文档可能过时，不能覆盖当前运行时代码。

## 禁止做法

- 不要从运行镜像移除迁移文件或 bootstrap 脚本。
- 不要只在源码、`.env.example`、Compose/Docker、UI 或文档中的一个位置修改变量名。
- 不要记录密钥或添加生产默认密码。
- 不要让测试或维护自动化指向未经授权的真实数据库文件。
