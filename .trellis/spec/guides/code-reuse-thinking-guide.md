# 代码复用思考指南

当你准备新增一个可能已有所有者的模式时，先使用本指南。

## 先搜索

同时按行为和具体值搜索：

```powershell
rg -n "requestJson|useJsonMutation|FormSection|FormTextField" src tests
rg -n "parse.*Payload|build.*Payload|normalize|serialize" src tests
rg -n "准备修改的值或字段" .
```

决定新增抽象前，检查源码、测试、规范、迁移文件、环境变量示例和部署脚本。

## 现有复用边界

| 需求 | 现有所有者 |
|---|---|
| 重复表单区块/字段/提交 UI | `src/components/forms/` |
| FormData 提取 | `src/lib/admin/forms/form-data.ts` |
| 实体表单到 JSON 负载 | `src/lib/admin/forms/*-form-payload.ts` |
| JSON mutation 与 pending 生命周期 | `src/lib/admin/json-mutation.ts`、`use-json-mutation.ts` |
| 站点/模型/资源负载规范化 | `src/lib/*-payload.ts` |
| 客户端筛选与展示格式化 | `src/lib/*-filter.ts`、`model-display.ts` |
| 实体数据库写入 | `src/server/admin/*.ts` |
| 目录查询与投影 | `src/server/directory/` |
| 数据库类型 | `src/db/types.ts` |
| 设计变量和通用控件 | `src/app/globals.css` |

## 抽取还是保持局部

满足以下条件时抽取：

- 相同行为至少出现三次；
- 输入和输出稳定；
- 测试可以在不切换实体分支的情况下描述共享契约；
- 共享能够消除实质重复。

满足以下条件时保持局部：

- 只有视觉形状相似；
- 确认、导航、删除、校验或关系行为不同；
- 抽象需要大型配置 DSL；
- 当前只有一个消费者。

管理端重构是参考案例：共享了表单外壳和传输层，同时保留站点价格、模型选择、标签和实体删除语义的领域归属。

## 多消费者值

修改字段名、枚举、环境变量、数据库路径、迁移 tag 或 CSS 变量前，搜索所有出现位置。常见多表面契约包括：

- schema 字段 -> migration -> parser/service -> projection -> form/UI -> tests；
- 环境变量 -> resolver -> Docker/Compose -> `.env.example` -> docs -> tests；
- 设计变量 -> 全局类 -> 组件工具类；
- 迁移文件 -> journal -> Docker bootstrap -> `tests/test-db.ts`。

## 禁止做法

- 只有参数不同，不要为每个实体创建一个 Hook 或服务。
- 不要用通用 CRUD repository 覆盖不同删除/关系规则。
- 不要在消费者旁边复制解析器；扩展其所有者边界。
- 修改字面值前必须搜索所有消费者。
