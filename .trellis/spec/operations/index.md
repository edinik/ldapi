# 运维规范

本层适用于 Docker 构建、运行时 bootstrap、环境变量、SQLite 持久化、部署文档和维护脚本。

## 规范索引

| 规范 | 适用场景 |
|---|---|
| [部署与脚本](./deployment-and-scripts.md) | Standalone 构建、容器、迁移、持久化数据和管理员脚本 |

## 开发前检查

- 修改 Docker、Compose、环境变量、数据库路径、启动流程或脚本前，阅读 `deployment-and-scripts.md`。
- schema 或迁移变更同时阅读 `../backend/database-and-migrations.md`。
- 密钥和集成配置变更同时阅读 `../backend/authentication-and-integrations.md`。
- 同一配置值出现在源码、Docker、示例和文档中时，使用 `../guides/cross-layer-thinking-guide.md`。

## 质量检查

- 在 `npm run check` 后运行 `npm run build`。
- 容器变更需核对 standalone 输出、运行时资源复制、entrypoint、数据 mount、必需环境变量和迁移 bootstrap 是否一致。
- 除非任务明确授权，不得使用仓库真实数据文件验证部署变更。
