# 管理端表单与 CRUD 重构实施计划

1. 建立质量基线
   - 添加 `test`、`typecheck`、组合检查脚本。
   - 调整 ESLint 产品源码范围。
   - 将登录、登出源码正则测试替换为稳定行为测试，确认基线全绿。

2. 提取纯表单负载
   - 为 site/model/resource 新增 serializer 及测试。
   - 迁移三个表单使用 serializer，逐一核对字段、null、boolean、array 和默认值。

3. 提取共享表单原语
   - 依次迁移 `FormSection`、`FormTextField`、`FormCheckboxGroup`、`FormSubmitBar`。
   - 每次迁移后运行相关 serializer 与现有 payload 测试。
   - 保留领域专用控件，不继续泛化。

4. 提取客户端 mutation
   - 添加可测试的 JSON 请求核心和最小 pending hook/封装。
   - 迁移六个新增/编辑客户端。
   - 保持所有确认文案、跳转和软删/硬删语义。

5. 建立服务端写入边界
   - 定义共享 `AppDb` 类型。
   - 参数化 `syncSiteModels` 数据库依赖。
   - 创建并测试 models/resources/sites 服务。
   - 逐组迁移 Route Handlers，使其只保留 HTTP 与认证责任。

6. 完整验证

```powershell
npm run typecheck
npm test
npm run lint
npm run build
```

手工回归新增、编辑、删除/停用站点、模型和资源，以及登录、退出。

## Risky Files / Rollback Points

- `src/components/SiteForm.tsx`：字段最多；serializer 先行，迁移后单独提交或形成明确 diff 检查点。
- `src/lib/site-model-payload.ts` 与 sites Route Handlers：关联同步风险最高；内存数据库测试通过后再迁移路由。
- 每完成一个实体服务即运行全量测试，避免三类 CRUD 同时失去可工作基线。
