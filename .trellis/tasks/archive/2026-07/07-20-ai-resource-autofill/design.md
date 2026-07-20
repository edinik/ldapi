# Technical Design

## Summary

新增一个受认证保护的资源 AI 生成端点和资源专用生成 helper。新增资源表单在“工具项目”状态下收集标题及可选官网/GitHub，将其发送到服务端；服务端沿用现有 AI 配置调用 OpenAI-compatible Chat Completions，并要求研究工具优先查询已提供地址。只有通过严格解析和校验的建议才返回浏览器，客户端再以“只填空字段”的规则合并到表单。

## Boundaries and Ownership

- `src/components/ResourceForm.tsx`
  - 仅拥有新增表单的 AI 按钮、生成状态、候选标签和表单回填交互。
  - 继续由现有 `buildResourceFormPayload` 负责最终保存负载。
  - AI 能力以 `isNew && type === "tool"` 为显示边界，编辑页不受影响。
- `src/app/api/resources/generate/route.ts`
  - 使用 `requireAuth()`。
  - 解析 JSON 请求、加载已存 AI 设置、解析 OpenAI-compatible 配置。
  - 把上游失败转换为安全的 `502`，输入错误使用 `400`。
- `src/lib/resource-ai-contract.ts`
  - 拥有客户端安全的请求/响应类型、输入与 suggestion 校验，以及“只填空字段”的纯合并 helper。
- `src/lib/resource-ai.ts`
  - 仅拥有提示词、Chat Completions 请求、SSE/JSON assistant 解析和上游错误转换；客户端组件不得导入。
- 测试位于 `tests/resource-ai.test.ts`，必要时扩展现有表单负载测试，证明保存契约未变化。

## Contracts

### Browser request

```ts
type ResourceAiGenerateRequest = {
  title: string;
  githubUrl?: string | null;
  officialUrl?: string | null;
  existingTags?: string[];
};
```

- `title` trim 后不能为空。
- URL 输入只接受空值或 `http:` / `https:`。
- `existingTags` trim、去重并限制数量/长度，仅用于提示 AI 优先复用标签。

### Browser response

```ts
type ResourceAiSuggestion = {
  description: string;
  tags: string[];
  githubUrl: string | null;
  officialUrl: string | null;
  demoUrl: string | null;
};
```

- 简介折叠多余空白并保持一句话展示长度。
- 标签 trim、大小写不敏感去重并限制为若干项。
- `githubUrl` 除 HTTP(S) 外还必须属于 `github.com`。
- 官网和演示站只接受 HTTP(S) URL。
- 缺失或无法验证的链接为 `null`。

### Merge behavior

```text
当前表单值非空 -> 保留当前值
当前表单值为空 + AI 值有效 -> 填入 AI 值
AI 标签已选择 -> 不显示为候选
AI 标签未选择 -> 显示候选，点击后加入 selectedTags
```

合并时重新读取响应到达时的表单值，而不是使用请求发出时的快照，避免覆盖用户等待期间继续输入的内容。

## Prompt and Research Strategy

- 系统提示要求输出单一 JSON 对象，不输出 Markdown 或解释。
- 若提供 GitHub/官网，提示 AI 先访问并交叉核对这些地址，再进行标题搜索。
- 若未提供地址，按标题搜索可信来源。
- 使用 `src/lib/openai-compatible-research.ts` 中与模型资料生成共享的研究工具声明。
- 提示 AI 不确定时返回 `null`，不得猜测链接。
- 应用服务端不直接 `fetch` 用户提供的第三方 URL，避免内网地址、重定向和 DNS 重绑定形成 SSRF 风险。

## UI Flow

1. 管理员选择工具项目并填写标题，可选填 GitHub/官网。
2. 点击“AI 生成内容”。
3. 客户端校验标题，进入 loading 状态并显示明确反馈。
4. 请求成功且响应契约有效后：
   - 只填充空简介/链接字段；
   - 在标签区显示候选标签按钮；
   - 展示实际填充项数量和候选标签数量。
5. 请求失败、超时、类型切换或组件卸载时终止/忽略结果，不修改现有表单。
6. 用户审阅、编辑、选择标签后，通过原保存按钮提交。

## Compatibility and Migration

- 不修改资源数据库 schema、现有创建/编辑 API 或公开目录 DTO。
- 不修改 AI 设置存储；继续使用 `resolveOpenAiCompatibleConfig`。
- 不改变编辑资源页面行为。
- 不要求所有兼容供应商都支持研究工具；不支持时沿用安全失败提示，不回退到未经研究的伪造内容。

## Error Handling

| Condition | Behavior |
|---|---|
| 标题为空 | 客户端提示；服务端仍返回 400 |
| 未配置 AI | 服务端返回现有配置错误 |
| 上游非 2xx / 网络失败 | 返回安全中文错误和 502 |
| 上游正文不是有效 JSON | 返回 502，不回填 |
| 简介/标签/URL 契约无效 | 返回 502，不回填 |
| 客户端超时或取消 | 显示失败/取消状态，不修改表单 |
| 响应到达时已切换为教程 | 丢弃结果，不回填 |

## Rollback

新增端点、helper、测试和表单 UI 均为独立增量；回滚时删除新增文件并还原 `ResourceForm.tsx` 即可，不涉及数据迁移或持久化回滚。
