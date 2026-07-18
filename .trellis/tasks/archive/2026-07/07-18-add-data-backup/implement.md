# 数据备份实施计划

## 1. 锁定认证与备份核心契约

- [x] 新增备份凭据解析与重新认证策略，复用现有密码和 TOTP 验证函数。
- [x] 新增 API session 读取结果，使备份路由可取得当前 `userId`，同时保持现有 `requireAuth()` 的 `401` 契约。
- [x] 添加认证测试：缺失/无效 session、错误密码、未启用 TOTP、启用 TOTP 时缺失/错误/正确验证码。

## 2. 实现 SQLite 一致性备份服务

- [x] 抽取 `data/sqlite.db` 路径所有者并让生产数据库连接复用。
- [x] 使用 `better-sqlite3#backup()` 生成唯一临时快照。
- [x] 在副本中切换到 `DELETE` journal mode、清空 `sessions` 并执行 `PRAGMA integrity_check`。
- [x] 关闭所有连接、读取文件、生成 UTC 文件名，并在 `finally` 清理临时目录。
- [x] 添加文件级 SQLite 测试：业务数据保留、备份 session 为空、源 session 保留、完整性为 `ok`、失败后无临时残留。

## 3. 增加受保护的下载 API

- [x] 新增 `POST /api/backup`，按顺序执行 HTTPS 检查、session 检查、请求解析、重新认证和备份生成。
- [x] 返回 SQLite attachment、稳定文件名和 no-store header。
- [x] 将预期认证失败映射为 `400/401/403`，将内部备份失败映射为不泄漏细节的 `500`。
- [x] 为 HTTPS 判断、文件名和响应契约中的纯辅助逻辑添加针对性测试。

## 4. 增加管理员备份页面

- [x] 新增 `/admin/backup` 服务端页面，认证并读取当前管理员 TOTP 状态。
- [x] 新增路由局部客户端表单，提交密码/可选 TOTP、显示 pending/error、触发 Blob 下载并清理敏感输入。
- [x] 使用现有 shadcn 组件和 lucide 下载图标，保证 label、焦点、按钮类型与移动端布局正确。
- [x] 从 `/admin` 增加“数据备份”入口。

## 5. 更新运维文档

- [x] 在 README 的部署/维护部分说明后台备份入口、文件敏感性和 HTTPS 要求。
- [x] 记录停机恢复、恢复前副本、启动验证和失败回滚步骤。
- [x] 明确恢复后 session 已清空，需要重新登录；不支持应用内恢复和跨版本降级。

## 6. 验证与评审

- [x] 运行备份认证和 SQLite 服务的针对性测试。
- [x] 运行 `npm run check`。
- [x] 在 check 完成后运行 `npm run build`。
- [x] 运行 `git diff --check`。
- [x] 本地 HTTP 验证未登录页面重定向和 API `401`；因未读取用户 TOTP 密钥，未执行真实登录下载，认证成功路径由单元测试、SQLite 文件测试和生产构建覆盖。
- [x] 核对 git diff 不包含 `data/sqlite.db`、临时备份或其他用户数据。

## Risk And Rollback Points

- WAL 风险：副本清空 session 前必须切换 `journal_mode = DELETE`，测试必须从最终下载文件重新打开验证。
- 敏感信息风险：禁止日志记录请求体、凭据或备份内容；响应必须 no-store。
- 临时文件风险：所有创建路径必须位于唯一临时目录，任何异常都执行清理。
- 路径漂移风险：生产连接与备份服务共享数据库路径所有者，不新增第三个运行时字面值。
- 回滚不涉及数据库迁移；删除新增功能代码并恢复导航/文档即可。

## Planned Validation Commands

```powershell
npx tsx --test tests/backup-auth.test.ts tests/database-backup.test.ts
npm run check
npm run build
git diff --check
git status --short
```
