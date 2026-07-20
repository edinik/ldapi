# 修复筛选下拉框收起标签

## Goal

确保首页筛选下拉框在收起状态显示面向用户的中文选项标签，而不是内部状态值。

## Background

- 共享组件 `src/components/FilterSelect.tsx` 使用 Base UI Select。
- 下拉列表通过 `SelectItem` 正确显示 `option.label`，但收起状态的 `SelectValue` 当前回退显示原始 `value`。
- 受影响的当前调用点包括站点筛选的“模型”，以及模型筛选的“开发者”和“排序”。

## Requirements

- `FilterSelect` 应根据当前 `value` 从 `options` 中解析并显示对应 `label`。
- 站点模型默认值 `all` 应显示“全部模型”。
- 模型开发者默认值 `all` 应显示“全部开发者”。
- 模型排序默认值 `releaseDate-desc` 应显示“发布日期（最新）”。
- 用户选择其他选项后，收起状态继续显示该选项的标签。
- 不改变筛选状态值、过滤逻辑、下拉选项内容或布局。

## Acceptance Criteria

- [x] 三个受影响的筛选框在初始收起状态显示正确中文标签。
- [x] 展开并选择其他选项后，触发器显示所选选项的标签。
- [x] 内部 `value` 和现有筛选行为保持不变。
- [x] 项目质量检查和生产构建通过。

## Out of Scope

- 修改通用 `SelectValue` 的全局行为。
- 调整筛选栏布局、颜色或交互方式。
