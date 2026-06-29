# LDAPI

LDAPI 是一个面向 LinuxDo 社区 AI 公益站的信息导航与维护工具。公开页面用于展示可用站点、支持模型、签到方式、限速说明和活跃要求；后台用于管理员持续录入、编辑和删除站点数据。

## 功能概览

- 公开目录：按卡片展示 AI 公益站入口、描述、能力标签和相关链接。
- 能力标注：记录 Claude Code、Codex、沉浸式翻译、签到、自动签到、限速和活跃度要求。
- 模型维护：为每个站点关联多个模型名称。
- 管理后台：支持登录后新增、编辑、删除站点记录。
- 本地 SQLite：使用 Drizzle ORM 管理数据库结构和查询。

## 技术栈

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS 4
- Drizzle ORM
- SQLite / better-sqlite3

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 初始化数据库

项目默认读取 `data/sqlite.db`，Drizzle 配置位于 `drizzle.config.ts`。

```bash
npm run db:push
```

### 3. 创建管理员账号

默认会创建 `admin / changeme`：

```bash
npm run seed
```

也可以指定用户名和密码：

```bash
npm run seed -- admin your-password
```

### 4. 启动开发服务

```bash
npm run dev
```

打开 `http://localhost:3000` 查看公开目录，打开 `http://localhost:3000/login` 进入后台登录页。

## 常用脚本

```bash
npm run dev        # 启动开发服务
npm run build      # 构建生产版本
npm run start      # 启动生产服务
npm run lint       # 运行 ESLint
npm run db:push    # 将当前 schema 推送到 SQLite
npm run db:studio  # 打开 Drizzle Studio
npm run seed       # 创建管理员账号
```

项目还提供 `scripts/reset-password.ts`，用于把 `admin` 用户密码重置为 `admin`：

```bash
npx tsx scripts/reset-password.ts
```

## 数据模型

核心表定义在 `src/db/schema.ts`：

- `sites`：站点基本信息、LinuxDo 相关链接、签到信息、能力支持、限制说明和发布状态。
- `models`：可关联的模型名称。
- `site_models`：站点与模型的多对多关联。
- `admin_users`：后台管理员账号。
- `sessions`：后台登录会话。

## 目录结构

```text
src/
  app/                 Next.js 页面与 API Routes
  components/          复用组件
  db/                  Drizzle 数据库连接与 schema
  lib/                 认证与 session 工具
scripts/               数据初始化与维护脚本
data/                  SQLite 数据库文件目录
docs/                  项目计划与过程文档
```

## 管理入口

- 公开目录：`/`
- 登录页：`/login`
- 后台首页：`/admin`
- 新增站点：`/admin/sites/new`
- 编辑站点：`/admin/sites/[id]/edit`

后台接口会校验登录 session；未登录时，写入类 API 会返回 401。

## 注意事项

- 生产环境请修改默认管理员密码，不要使用 `changeme` 或 `admin`。
- 当前数据库路径固定为 `data/sqlite.db`，部署时需要保证该目录可写并持久化。
- 如果修改 `src/db/schema.ts`，请同步运行 `npm run db:push` 或使用 Drizzle migration 流程更新数据库。
