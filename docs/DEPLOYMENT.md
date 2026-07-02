# 部署指南

## 问题解决

### 1. 退出登录重定向问题

**问题描述**：部署到服务器后，点击退出按钮会跳转到 `http://localhost:3000/admin` 而不是当前域名的登录页。

**解决方案**：已修复 `src/app/api/auth/logout/route.ts`，使用相对路径重定向，确保在任何域名下都能正确跳转到登录页。

**修改内容**：
```typescript
// 修改前
return NextResponse.redirect(new URL("/login", req.url), { status: 303 });

// 修改后
redirect("/login");
```

### 2. Turnstile 验证组件不显示

**问题描述**：登录页面没有显示 Cloudflare Turnstile 验证组件。

**原因**：Turnstile 是可选功能，只有在配置了环境变量 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 时才会显示。

**如何启用**：

1. 获取 Cloudflare Turnstile 密钥（参考 `docs/TURNSTILE.md`）
2. 在服务器上创建 `.env.local` 文件：

```env
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key-here
TURNSTILE_SECRET_KEY=your-secret-key-here
```

3. 重启应用

**测试密钥**（仅开发环境）：
```env
# 始终通过验证
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

## 部署步骤

### 1. 构建项目

```bash
npm run build
```

### 2. 配置环境变量

在服务器上创建 `.env.local` 文件：

```env
# 基础配置
APP_PORT=3000
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password

# Cloudflare Turnstile（可选）
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key
TURNSTILE_SECRET_KEY=your-secret-key
```

### 3. 启动应用

```bash
npm start
```

或使用 PM2：

```bash
pm2 start npm --name "ldapi" -- start
```

### 4. 配置反向代理

#### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 验证部署

### 1. 检查退出登录

- 登录后台
- 点击"退出"按钮
- 应该跳转到 `https://your-domain.com/login`（而不是 localhost）

### 2. 检查 Turnstile（如已配置）

- 访问登录页
- 应该看到 Cloudflare Turnstile 验证组件
- 完成验证后才能提交登录表单

### 3. 检查 TOTP（如已启用）

- 登录后访问"安全设置"
- 生成 TOTP 密钥
- 应该显示二维码和密钥信息
- 使用验证器应用扫码添加

## 故障排查

### 退出登录仍然跳转到 localhost

1. 确认已更新代码到最新版本
2. 清除浏览器缓存
3. 重新构建并重启应用

### Turnstile 不显示

1. 检查 `.env.local` 文件是否包含 `NEXT_PUBLIC_TURNSTILE_SITE_KEY`
2. 确认环境变量名称正确（必须以 `NEXT_PUBLIC_` 开头）
3. 重启应用使环境变量生效

### TOTP 二维码不显示

1. 检查浏览器控制台是否有错误
2. 确认 `qrcode` 依赖已正确安装
3. 重新构建应用

## 安全建议

1. **使用 HTTPS**：生产环境必须使用 HTTPS
2. **强密码**：设置强管理员密码
3. **启用 TOTP**：为管理员账户启用两步验证
4. **启用 Turnstile**：防止自动化登录攻击
5. **定期更新**：保持依赖包更新到最新版本
6. **监控日志**：定期检查应用日志发现异常行为

## 更新应用

```bash
# 拉取最新代码
git pull

# 安装依赖
npm install

# 构建
npm run build

# 重启应用（PM2）
pm2 restart ldapi

# 或普通方式重启
# 先停止当前进程，然后
npm start
```
