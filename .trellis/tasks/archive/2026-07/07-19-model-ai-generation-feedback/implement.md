# 完善模型 AI 生成反馈：实施计划

## Implementation Checklist

1. 在 `src/lib/model-import-ai.ts` 定义规范化后的生成元数据与 usage 类型。
2. 增加安全数值读取、模型读取和 usage 归一化函数，覆盖 OpenAI-compatible 常见字段。
3. 扩展 JSON 与 SSE 响应解析，在保留正文拼接行为的同时收集实际模型和最终 usage 数据块。
4. 扩展 `generateModelImportContent` 结果，在成功以及已获得元数据的内容校验失败场景返回请求模型、实际模型和 Token 统计。
5. 更新 `src/app/api/models/import/generate/route.ts`，把安全元数据加入成功/失败 JSON，保持现有认证与 status code。
6. 重构 `ImportModelsClient.tsx` 的生成请求为 `try/catch/finally`，加入实时耗时、30 秒长耗时提示、180 秒 AbortController 超时和可靠状态恢复。
7. 使用现有 `Alert`、`Badge`、`Button` 与 lucide `LoaderCircle` 增加生成中、成功、失败以及模型/Token 统计展示；不实时写入部分 JSON。
8. 扩展 `tests/model-import-ai.test.ts`：
   - JSON 响应的模型与 OpenAI usage；
   - SSE 独立最终 usage 块和模型；
   - 等价字段与缺失字段降级；
   - 非法 usage 数值不进入 DTO；
   - 现有正文拼接、请求体和导入校验行为保持。
9. 检查受影响文件的类型和格式，确认没有误改现有导入/预检行为。

## Validation

按顺序运行：

```powershell
npx tsx --test tests/model-import-ai.test.ts
npm run check
npm run build
git diff --check
```

手工验证：

- 正常生成：立即出现 spinner 和耗时，成功后显示最终耗时、模型与已提供 Token。
- 慢请求：30 秒后出现长耗时提示。
- 超时/断网/HTTP 失败/非 JSON 路由响应：显示原因和耗时，控件恢复。
- 上游缺少缓存、思考或实际模型：显示“未提供”，不影响有效 JSON 更新。
- 浅色/深色、桌面/移动端和键盘 Enter 触发均可用，控制台无新增 React/Base UI 警告。

## Risk and Rollback Points

- 风险最高的是 SSE 最终 usage 块通常没有 choices；解析循环必须在正文分支之外独立收集元数据。
- 兼容字段只接受明确的非负有限数字，避免宽松转换把字符串或无效值显示为 Token。
- 客户端清理必须集中在 `finally`，避免异常路径永久停留在 loading。
- 若上游不支持 `stream_options.include_usage`，现有正文仍应成功，统计仅显示“未提供”。
