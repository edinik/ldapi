# Cloudflare Turnstile 配置指南

本项目集成了 Cloudflare Turnstile 来防止自动化攻击和机器人登录。

## 获取 Turnstile 密钥

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 选择你的网站或账户
3. 进入 **Turnstile** 页面
4. 点击 **Add Site** 创建新的 Turnstile 应用
5. 填写站点信息：
   - **Site Name**: 例如 "LDAPI Admin Login"
   - **Domain**: 你的域名（开发环境可以使用 `localhost`）
   - **Widget Mode**: 选择 `Managed` (推荐) 或 `Non-Interactive`
6. 创建后会获得：
   - **Site Key** (公开密钥)
   - **Secret Key** (服务器端密钥)

## 配置环境变量

将获取的密钥添加到 `.env.local` 文件：

```env
# Cloudflare Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-site-key-here
TURNSTILE_SECRET_KEY=your-secret-key-here
```

**注意**：
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 是公开密钥，会暴露给客户端
- `TURNSTILE_SECRET_KEY` 是私密密钥，仅在服务器端使用，不会暴露给客户端

## 功能特性

### 自动降级

如果未配置 `TURNSTILE_SECRET_KEY`，系统会自动跳过 Turnstile 验证，方便本地开发。

### 条件渲染

只有在配置了 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 时，登录页面才会显示 Turnstile 组件。

### 错误处理

- Turnstile 加载失败时会显示友好的错误提示
- 验证失败会阻止登录并返回明确的错误信息
- 网络错误会被捕获并记录到服务器日志

## 测试

### 开发环境测试

Cloudflare 提供了测试密钥对，可以在开发环境中使用：

```env
# 测试环境密钥（始终通过验证）
NEXT_PUBLIC_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA

# 测试环境密钥（始终失败验证）
NEXT_PUBLIC_TURNSTILE_SITE_KEY=2x00000000000000000000AB
TURNSTILE_SECRET_KEY=2x0000000000000000000000000000000AA
```

### 运行单元测试

```bash
npx tsx --test tests/turnstile.test.ts
```

## 安全建议

1. **不要将 Secret Key 提交到版本控制系统**
   - `.env.local` 已添加到 `.gitignore`
   - 仅在 `.env.example` 中提供示例

2. **生产环境使用真实密钥**
   - 测试密钥仅供开发使用
   - 生产环境必须使用从 Cloudflare 获取的真实密钥

3. **定期轮换密钥**
   - 如果怀疑密钥泄露，立即在 Cloudflare Dashboard 中重新生成

4. **监控验证失败**
   - 服务器会记录验证失败的日志
   - 定期检查日志以发现潜在的攻击行为

## 故障排查

### Turnstile 组件不显示

- 检查 `NEXT_PUBLIC_TURNSTILE_SITE_KEY` 是否正确配置
- 确认环境变量名称以 `NEXT_PUBLIC_` 开头
- 重启开发服务器使环境变量生效

### 验证总是失败

- 确认 `TURNSTILE_SECRET_KEY` 与 Site Key 匹配
- 检查域名是否在 Cloudflare Turnstile 配置中
- 查看服务器日志获取详细错误信息

### 在某些国家/地区无法加载

- Cloudflare Turnstile 依赖 CDN，某些地区可能需要配置代理
- 考虑使用 `compat` 模式提高兼容性

## 相关链接

- [Cloudflare Turnstile 文档](https://developers.cloudflare.com/turnstile/)
- [React Turnstile 组件](https://github.com/marsidev/react-turnstile)
- [Turnstile API 参考](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/)
