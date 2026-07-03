# LDAPI

LDAPI 是一个面向 LinuxDo 社区 AI 公益站的信息导航与维护工具。公开页面用于展示可用站点、支持模型、签到方式、限速说明和活跃要求；后台用于管理员持续录入、编辑和删除站点数据。

## 功能概览

- 公开目录：按卡片展示 AI 公益站入口、描述、能力标签和相关链接。
- 能力标注：记录 Claude Code、Codex、沉浸式翻译、签到、自动签到、限速和活跃度要求。
- 模型维护：为每个站点关联多个模型名称，并可维护模型开发者、能力、模态、价格、限制和主页展示信息。
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

## Docker 部署

项目提供 `Dockerfile` 和 `docker-compose.yml`，适合直接部署到 VPS。容器内监听 `3000` 端口，SQLite 数据库通过 `./data:/app/data` 挂载到宿主机，避免容器重建后数据丢失。

### 1. 准备 VPS

在服务器上安装 Docker 和 Docker Compose Plugin，然后把项目代码放到服务器目录中，例如：

```bash
git clone <your-repo-url> ldapi
cd ldapi
```

### 2. 配置环境变量

在项目根目录创建 `.env`，可以从示例文件复制：

```bash
cp .env.example .env
```

然后修改 `.env`：

```bash
APP_PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-this-password
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-...
AI_MODEL=gpt-4.1-mini
```

- `APP_PORT`：宿主机暴露端口，默认 `3000`。
- `ADMIN_USERNAME`：首次启动时创建的管理员用户名，默认 `admin`。
- `ADMIN_PASSWORD`：首次启动时创建的管理员密码，必须显式设置。
- `AI_BASE_URL`：OpenAI-compatible 接口地址，可选，留空默认 `https://api.openai.com/v1`。
- `AI_API_KEY`：AI 模型导入生成功能使用的服务端密钥，不会暴露给浏览器。
- `AI_MODEL`：用于生成模型导入 JSON 的模型名称，例如 `gpt-4.1-mini` 或兼容服务提供的模型 ID。

启动后也可以在后台 `安全设置 -> AI 导入生成` 中维护这些配置。后台保存的配置优先于 `.env`，API Key 不会明文回显；保存时留空 API Key 会保留当前密钥。

### 3. 构建并启动

```bash
docker compose up -d --build
```

首次启动时入口脚本会自动初始化 SQLite 表结构，并按 `ADMIN_USERNAME` / `ADMIN_PASSWORD` 创建管理员账号。账号已存在时不会覆盖旧密码。

随后访问：

- 公开目录：`http://<server-ip>:3000`
- 后台登录：`http://<server-ip>:3000/login`

如果修改了 `APP_PORT`，访问地址中的端口也需要同步调整。

### 4. 查看日志与维护

```bash
docker compose logs -f app
docker compose restart app
docker compose down
```

数据库文件保存在宿主机项目目录的 `data/sqlite.db`。迁移服务器或备份数据时，重点备份 `data/` 目录。

如果管理员账号已经存在，`npm run seed` 不会覆盖旧密码。需要重置密码时可进入容器执行：

```bash
docker compose exec app npx tsx scripts/reset-password.ts
```

该脚本会把 `admin` 用户密码重置为 `admin`，重置后请尽快改成安全密码或调整脚本后再执行。

### 5. 反向代理建议

生产环境建议用 Nginx、Caddy 或 VPS 面板把域名反向代理到 `127.0.0.1:3000`，并配置 HTTPS。反向代理后可以把 `APP_PORT` 改为仅供本机或防火墙内访问的端口。

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
- `models`：可关联的模型资料，包括名称、开发者、能力、模态、价格、限制和展示状态。
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
- 模型管理：`/admin/models`
- 新增模型：`/admin/models/new`
- 编辑模型：`/admin/models/[id]/edit`

后台接口会校验登录 session；未登录时，写入类 API 会返回 401。

## 注意事项

- 生产环境请修改默认管理员密码，不要使用 `changeme` 或 `admin`。
- 当前数据库路径固定为 `data/sqlite.db`，部署时需要保证该目录可写并持久化。
- 如果修改 `src/db/schema.ts`，请同步运行 `npm run db:push` 或使用 Drizzle migration 流程更新数据库。
