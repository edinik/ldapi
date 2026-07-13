# 项目重构总体实施计划

## Execution Order

1. 评审并批准总体 `prd.md`、`design.md` 和本计划。
2. 启动子任务 `07-13-admin-crud-refactor`，按其计划实施、检查、提交和归档。
3. 复核第一阶段建立的模块命名与质量命令，必要时更新第二阶段计划。
4. 启动子任务 `07-13-directory-query-refactor`，按其计划实施、检查、提交和归档。
5. 在父任务执行集成复核，确认兼容性、文档和质量门，再归档父任务。

## Integration Validation

```powershell
npm run typecheck
npm test
npm run lint
npm run build
```

手工验证：登录与退出、站点/模型/资源新增编辑删除、首页三个 tab 的筛选与展示。

## Review Gates

- 每个子任务开始前单独评审其规划材料。
- 每个子任务合并前确认没有 UI、API 或 schema 变化。
- 第二阶段开始前确认第一阶段没有留下未迁移的重复公共表单实现。

## Rollback Points

- 子任务一提交后为第一个稳定回滚点。
- 子任务二提交后执行最终集成检查；失败时优先回滚子任务二，不连带撤销已验收的子任务一。
