# 测试规范

本层适用于单元测试、边界测试、SQLite 集成测试和仓库质量门。

## 规范索引

| 规范 | 适用场景 |
|---|---|
| [测试模式](./test-patterns.md) | 选择测试层级、fixture、fake、SQLite 设置和验证命令 |

## 开发前检查

- 修改行为或新增边界前，阅读 `test-patterns.md`。
- 阅读对应的前端/后端规范，确认测试断言的是正确契约。
- 优先使用相邻现有测试作为 import、清理和断言的模板。
- 跨层变更使用 `../guides/cross-layer-thinking-guide.md` 映射完整往返流程。

## 质量检查

编辑过程中运行针对性测试。完成前运行 `npm run check`，待其结束后再运行 `npm run build`，并运行 `git diff --check`。
