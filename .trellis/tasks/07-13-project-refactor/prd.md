# 项目重构规划

## Goal

在保持现有产品行为可验证的前提下，通过渐进式结构重构减少重复与职责混杂，优先提升 ldapi 项目的可维护性和后续功能开发速度。

## Background

- 仓库是单体 Next.js / TypeScript 应用，包含页面与组件、Route Handlers、Drizzle 数据层、领域辅助函数及对应测试。
- 当前主要业务域是站点、模型、站点模型配置和资源目录；管理端通过客户端表单调用 Route Handlers，页面和路由直接使用 Drizzle。

## Confirmed Facts

- `src/components/SiteForm.tsx`、`ModelForm.tsx`、`ResourceForm.tsx` 分别约 29 KB、22 KB、12 KB，并各自重复实现 `Section`、`TextField` 和基础值归一化逻辑。
- 站点、模型、资源的新增/编辑客户端重复维护 `saving`、`fetch`、跳转和删除确认流程，例如 `src/app/admin/sites/[id]/edit/EditSiteClient.tsx:15`、`src/app/admin/models/[id]/edit/EditModelClient.tsx:13`、`src/app/admin/resources/[id]/edit/EditResourceClient.tsx:14`。
- 三组 CRUD Route Handlers 重复认证、ID 解析、请求解析和响应流程，例如 `src/app/api/sites/[id]/route.ts:8`、`src/app/api/models/[id]/route.ts:8`、`src/app/api/resources/[id]/route.ts:8`。
- `src/app/page.tsx:16` 同时负责认证、三类数据查询、站点模型能力/价格解析、DTO 映射和页面组合，是最近 30 次提交中变更最频繁的业务文件（7 次）。
- 数据访问目前分散在页面、Route Handlers 和 `src/lib` 中，尚无明确的领域服务或仓储边界。
- 当前 TypeScript 检查通过。全量测试 69 项中 67 项通过，2 项失败；失败项是对源码文本做正则匹配的脆弱测试，与 Turnstile 参数扩展和 logout 重定向实现不同步。
- ESLint 当前被非产品的 `.pi/extensions/trellis/index.ts` 中 1 个错误阻断；产品代码另有 2 个警告，因此需要明确产品 lint 边界。

## Requirements

- 重构范围必须基于仓库中的实际证据确定，包括重复实现、职责混杂、边界不清、测试困难或高变更成本等信号。
- 重构候选项必须按“降低维护成本和加快后续开发”的收益排序，而非以技术新颖性或代码改动量排序。
- 采用分阶段实施，每阶段必须能独立测试、评审和回滚。
- 第一阶段聚焦管理端站点、模型、资源的表单与 CRUD 公共能力。
- 第二阶段聚焦首页数据装配、领域查询和展示 DTO 边界。
- 第一阶段必须保持现有 UI、API 路径、请求/响应格式和数据库 schema 不变。
- 允许调整内部文件结构、模块边界和实现方式，但必须通过行为级验证证明兼容性。
- 允许修复现有测试中与当前实现不同步的源码文本正则断言。
- 第一阶段必须把测试结构改进作为正式交付物：共享逻辑需要行为测试，现有脆弱源码匹配测试应改为稳定的行为或契约验证。
- 不引入新的运行时框架、表单框架或 ORM；优先使用现有 React、Next.js、Drizzle 和 Node 测试能力。
- 公共抽象只覆盖已出现至少三次且契约稳定的模式；领域差异继续由站点、模型和资源模块分别拥有。

## Task Map

1. `07-13-admin-crud-refactor`：第一阶段，重构管理端共享表单、请求流程、站点/模型/资源写入服务和测试基线。
2. `07-13-directory-query-refactor`：第二阶段，将首页查询、领域转换和展示 DTO 从页面中拆分。

推荐顺序为第一阶段完成并稳定模块命名、测试命令后再执行第二阶段；第二阶段不依赖第一阶段的运行时结果，但复用其目录和质量约定。

## Acceptance Criteria

- [x] `07-13-admin-crud-refactor` 完成：共享表单、请求处理和领域写入逻辑具有稳定的行为测试，不依赖实现文本排列。
- [x] `07-13-directory-query-refactor` 完成：`src/app/page.tsx` 只负责编排认证、加载目录数据和渲染页面，不直接承担领域转换。
- [x] 每个子任务均通过类型检查、产品源码 lint、全量测试和生产构建。
- [x] 两个子任务集成后，用户可见 UI、API 契约和数据库 schema 与重构前一致。

## Out of Scope

- 在规划获批和任务正式启动前修改业务实现。
- 无证据支撑的全量重写或技术栈替换。
- 第一阶段中的 UI 改版、API 契约变更和数据库迁移。
- 为抽象而抽象的通用仓储、代码生成器或跨领域万能 CRUD 框架。
