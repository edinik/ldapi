# Hook 规范

## 当前范围

LDAPI 只使用少量局部 React Hook，没有全局客户端状态库，也没有服务端状态缓存库。

## 传输模式

传输函数应独立于 React，Hook 只封装生命周期状态：

```ts
const response = await requestJson(url, { method: "POST", body });

const { pending, mutate } = useJsonMutation();
const response = await mutate(url, "POST", body);
```

- `src/lib/admin/json-mutation.ts` 拥有 JSON header、序列化和 fetch 调用。
- `src/lib/admin/use-json-mutation.ts` 拥有 `pending`，并在 `finally` 中重置。
- 调用方拥有 URL、HTTP method、确认行为、导航和实体特有逻辑。
- 当某个 mutation 不应共享表单提交的 pending 状态时，例如独立删除操作，直接调用纯传输辅助函数。

## 命名与位置

- React Hook 以 `use` 开头。
- 纯辅助函数不得使用 `use` 前缀。
- Hook 放在其服务的边界附近。管理端 mutation Hook 位于 `src/lib/admin/`，而不是全局 hooks 目录。
- 只有 React 生命周期行为确实复用时才新增 Hook；URL 不同不足以为每个实体创建一个 Hook。

## 错误行为

- 不要静默吞掉网络错误。
- 保留响应对象，让调用方按照路由契约解释状态和负载。
- 包括请求 rejection 在内，pending 状态都必须在 `finally` 中复位。

参考测试：`tests/admin-json-mutation.test.ts`。

## 禁止做法

- 不要在传输 Hook 中嵌入 router 调用或确认文案。
- 不要在每个客户端页面重复构造 fetch header 和 body。
- 对由服务端页面加载且不跨浏览器路由共享的数据，不要引入全局服务端状态缓存。
