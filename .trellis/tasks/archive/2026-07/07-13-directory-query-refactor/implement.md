# 目录查询与展示边界重构实施计划

1. 复核第一阶段产出的 `AppDb`、`src/server` 目录与质量脚本。
2. 从 `src/app/page.tsx` 提取三个纯投影函数及完整 fixtures 测试。
3. 添加 `HomeDirectoryData` 类型，确保与 `HomeTabs` props 一致。
4. 创建可注入数据库的 `getHomeDirectoryData` 查询服务，保持现有 where/orderBy/relations。
5. 迁移 `src/app/page.tsx`：先认证，再调用查询服务，再渲染。
6. 用稳定认证测试替换 `tests/page-auth.test.ts` 的源码正则断言。
7. 执行完整验证：

```powershell
npm run typecheck
npm test
npm run lint
npm run build
```

8. 手工检查首页站点、模型、资源三个 tab 的数量、排序、筛选、能力与价格标签。

## Rollback Points

- 纯投影提取完成且测试通过后形成第一个检查点。
- 查询服务接入前保留页面原查询逻辑；若集成失败，可只回滚页面接线而保留已验证的纯投影。
