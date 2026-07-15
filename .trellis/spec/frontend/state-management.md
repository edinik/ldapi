# 状态管理

## 当前模式

应用使用服务端渲染数据配合 React 本地状态，没有全局状态库。

## 状态归属

- 数据库数据在服务端页面或服务中加载，再以类型化 props 传给客户端组件。
- 搜索文本、筛选选择、标签页、下拉框开关、表单编辑器和提交状态使用局部 `useState`。
- 依赖 props 和筛选状态的派生集合使用 `useMemo`，参考 `SiteDirectory`、`ModelOverview` 和 `ResourceDirectory`。
- 无法只用原生表单字段表示的领域编辑器使用受控状态，例如站点模型覆盖、价格和资源标签。
- 普通原生字段在提交时通过 `FormData` 读取，再交给其所有者序列化器。

```tsx
const [selectedTags, setSelectedTags] = useState<string[]>([]);
const filtered = useMemo(
  () => filterResources(resources, { query, type, tags: selectedTags }),
  [query, resources, selectedTags, type],
);
```

## 派生状态

- 源 props 和筛选状态是唯一事实来源。
- 不要维护第二份可变的筛选或排序结果。
- 纯筛选函数放入 `src/lib/*-filter.ts`；组件只拥有当前筛选值和渲染。
- 多种 action 共同更新一个复杂编辑器时可以考虑 reducer；孤立布尔值或单个输入不应使用 reducer。

## 服务端刷新与导航

当前管理端 mutation 在成功后通过导航或刷新获取新数据，而不是维护长期浏览器缓存。除非任务明确引入跨页面客户端状态，否则保留这一模式。

## 禁止做法

- 不要把孤立的下拉框或表单状态移入共享 store。
- 不要把 Drizzle 行保存在全局浏览器状态中。
- 没有明确编辑需求时，不要把 props 镜像到 state。
- 已有经过测试的纯筛选辅助函数时，不要在组件中重复实现。
