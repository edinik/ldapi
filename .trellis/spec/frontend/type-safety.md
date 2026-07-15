# 前端类型安全

## 浏览器边界规范化

原始表单和外部值以 `FormData` 或 `unknown` 开始，应在其归属边界一次性规范化，再把类型化结果向下传递。

- 管理端表单序列化器：`src/lib/admin/forms/*.ts`。
- 模型和资源 API 解析器：`src/lib/model-payload.ts`、`src/lib/resource-payload.ts`。
- 站点模型关系解析：`src/lib/site-model-payload.ts`。
- 数据库到展示层投影：`src/server/directory/projections.ts`。

新增字段时，扩展已有序列化器/解析器及其测试。不要在每个客户端或路由中新增一份 cast。

## DTO 归属

- 客户端目录消费明确的展示形状，例如 `SiteDirectoryItem`、`ModelDisplayItem` 和 `DirectoryResource`。
- 投影函数拥有存储字符串解析、nullable 覆盖、能力解析和价格标签生成。
- 只有展示层特有的扩展才可以在附近扩展客户端类型，例如 `SiteDirectoryItem`。
- 页面和客户端封装不得使用 `as unknown as` 强制把原始查询结果变成展示类型。

## 表单值

- 重复的 `FormData` 提取使用共享 `getFormValue`、`getFormValues` 和 `getFormBoolean`。
- 保留缺失/空值、`null` 和 `false` 的区别；它们在站点模型覆盖和可选设置中代表不同更新语义。
- 数字在边界处用有限数检查转换。空数字字段通常应变成 `null`，而不是零。

## 类型位置

- 局部 props 放在组件附近。
- 当纯辅助函数定义了契约时，可复用客户端领域类型放在该辅助函数附近。
- 数据库行和插入类型由后端拥有；前端客户端组件应接收 DTO，而不是导入 schema 类型。

## 已知现存捷径

站点 Route Handler 当前在单独规范化模型关系后，把站点标量记录 cast 为 `SiteWrite`。这是需要有计划改进的现有边界，不是新端点应复制的模式。

## 禁止做法

- 避免 `any`；值在验证前保持为 `unknown`。
- 已有类型化解析器时，避免继续传递宽泛的 `Record<string, unknown>`。
- 不要在组件内重复字符串、布尔值或数字规范化。
- 可以通过投影定义序列化契约时，不要给客户端传数据库形状的 props。
