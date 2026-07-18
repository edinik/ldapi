# 数据备份技术设计

## Architecture

```text
/admin
  -> /admin/backup server page
       -> requireAdmin()
       -> query whether current admin has TOTP enabled
       -> BackupDownloadForm client component
            -> POST /api/backup with password and optional TOTP
                 -> requireApiSession()
                 -> reauthenticate current admin
                 -> create sanitized SQLite snapshot
                 -> return no-store attachment response
```

职责划分：

- `src/app/admin/backup/page.tsx`：页面认证、读取 TOTP 启用状态、展示说明。
- `src/app/admin/backup/BackupDownloadForm.tsx`：本地表单状态、提交、错误展示和浏览器文件下载。
- `src/app/api/backup/route.ts`：HTTPS 检查、API session、请求解析、响应 status/header。
- `src/lib/backup-auth.ts`：可注入依赖的重新认证策略，不依赖 Next runtime。
- `src/server/backup/create-database-backup.ts`：SQLite 在线备份、快照净化、完整性检查、读取和清理。
- `src/db/database-path.ts`：`data/sqlite.db` 路径的单一源码所有者，供生产连接与备份服务复用。

该功能是一个紧密耦合的单一用户流程，不拆分父子任务。

## Authentication Flow

1. 页面使用 `requireAdmin()`，未登录时保持现有 redirect 行为。
2. API 使用新增的 `requireApiSession()` 返回当前 session 或既有 `401` JSON；现有 `requireAuth()` 继续保留并可委托给同一读取逻辑。
3. API 根据 session `userId` 加载当前管理员，不能由请求体指定用户名或用户 ID。
4. `backup-auth` 使用现有 `verifyPassword()` 验证密码。
5. 用户存在 `totpSecret` 时，使用现有 `verifyTotpCode()` 验证请求验证码。
6. 预期内失败使用明确结果联合类型；Route Handler 映射为 `400` 或 `403`，不创建备份。

Turnstile 不参与已登录后的重新认证。凭据只存在于 HTTPS POST 请求与进程内存中，不进入 URL、日志或数据库。

## Backup Lifecycle

1. 从 `src/db/database-path.ts` 取得生产数据库路径。
2. 使用独立的只读 `better-sqlite3` 连接打开源数据库，设置有限 busy timeout。
3. 在系统临时目录下创建唯一的 `ldapi-backup-*` 目录。
4. 调用 `Database#backup(destination)` 执行 SQLite 在线备份；该 API 会将 WAL 中已提交页面纳入一致性快照。
5. 关闭源连接，打开备份副本。
6. 将副本 journal mode 切换为 `DELETE`，再事务化清空 `sessions`；这样会话删除写回主 `.sqlite` 文件，而不是遗留在未下载的 `-wal` 文件中。
7. 执行 `PRAGMA integrity_check`，结果必须为单行 `ok`。
8. 关闭副本连接，将 `.sqlite` 文件读入 Buffer，生成 UTC 时间戳文件名。
9. 在 `finally` 中递归清理唯一临时目录。
10. Route Handler 将 Buffer 转为 `Uint8Array` 响应；临时文件在响应创建前已删除。

源数据库只读打开，清空 session 的操作仅发生在备份副本。任何阶段失败都不得返回部分文件。

## HTTP Contract

`POST /api/backup`

请求 JSON：

```json
{
  "password": "current-admin-password",
  "totpCode": "123456"
}
```

`totpCode` 仅在当前管理员启用 TOTP 时必需。成功响应：

- `200 OK`
- `Content-Type: application/vnd.sqlite3`
- `Content-Disposition: attachment; filename="ldapi-backup-<timestamp>.sqlite"`
- `Cache-Control: private, no-store, max-age=0`
- `Pragma: no-cache`
- 自定义文件名响应头供 fetch 下载逻辑读取，值与 `Content-Disposition` 一致。

失败响应：

- `400`：请求字段缺失、生产环境非 HTTPS。
- `401`：缺失、无效或过期 session，保持现有中文 API 认证文案。
- `403`：密码或所需 TOTP 验证失败。
- `500`：备份生成或完整性校验失败，返回通用中文错误，不暴露文件路径和底层异常。

生产环境通过请求 URL 协议或反向代理 `X-Forwarded-Proto` 判断 HTTPS。Compose 当前只绑定回环地址，README 的反向代理示例已传递该 header。

## UI Behavior

- 页面使用现有 shadcn `Card`、`Alert`、`Field`、`Input` 和 `Button`。
- 始终显示密码字段；仅在服务端确认当前管理员启用 TOTP 时显示验证码字段。
- 提交期间禁用按钮并显示处理中状态。
- 成功时使用 Blob URL 触发下载，随后撤销 URL 并清空凭据字段。
- 失败时在页面内显示 API 返回的中文错误，不导航到 JSON 页面。
- 页面明确提示备份未加密、包含敏感数据、恢复后会话失效。

## Compatibility And Limits

- 不修改 schema、Drizzle migration、环境变量或 Docker mount。
- 备份是当前 schema 版本的标准 SQLite 文件；不承诺向旧版本应用降级恢复。
- MVP 将最终文件读入内存，内存峰值与数据库大小近似线性。当前数据库量级很小；未来增长后再设计流式响应。
- 备份不会包含 `data/` 目录中的其他文件；当前持久应用状态的事实来源是 `data/sqlite.db`。

## Failure And Rollback

- 临时目录和所有数据库连接都在 `finally` 中清理/关闭。
- 完整性检查失败时不返回下载。
- 重新认证失败时不触碰 SQLite 备份流程。
- 本功能没有迁移，代码回滚只需移除页面、路由和备份服务并恢复后台导航/文档。
- 恢复操作由文档指导停机执行；失败时用恢复前保存的数据库副本回滚。
