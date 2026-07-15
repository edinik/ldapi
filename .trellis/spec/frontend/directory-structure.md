# 前端目录结构

## 归属地图

```text
src/app/
  layout.tsx                         根元数据和文档外壳
  page.tsx                           服务端渲染页面组合
  login/                             登录页面及其客户端表单
  admin/**/page.tsx                  认证后的服务端页面和数据加载
  admin/**/New*Client.tsx            浏览器端 mutation 和导航封装
  admin/**/Edit*Client.tsx           浏览器端 mutation、删除和导航封装
src/components/
  forms/                             可复用、与领域无关的表单原语
  *Form.tsx                          领域表单状态和控件
  *Directory.tsx / ModelOverview.tsx 可交互的公开目录视图
src/lib/admin/
  forms/                             FormData -> JSON 负载序列化器
  json-mutation.ts                   纯浏览器传输辅助函数
  use-json-mutation.ts               React pending 状态封装
src/lib/*-filter.ts                   纯客户端筛选契约
src/lib/model-display.ts              模型展示和筛选辅助函数
```

## 页面与组件边界

- `page.tsx` 负责编排认证、服务端数据加载和渲染，不应承担大段数据库记录到视图的转换。`src/app/page.tsx` 委托给 `getHomePageData()`，然后渲染 `HomeTabs`。
- 只在真正需要 Hook、浏览器 API 或事件处理的组件上添加 `"use client"`。`src/components/HomeTabs.tsx` 拥有标签页状态；`src/app/page.tsx` 保持为服务端组件。
- 路由专用的浏览器端编排放在对应路由附近，例如 `NewSiteClient.tsx` 和 `EditResourceClient.tsx`。
- 只有结构与领域无关且已复用的组件才放入 `src/components/forms/`。价格、标签、能力和图标编辑器继续由各自领域表单拥有。
- 纯浏览器边界辅助函数放入 `src/lib/`，不要塞进页面组件。表单序列化器位于 `src/lib/admin/forms/`；可复用筛选逻辑位于 `site-directory-filter.ts` 等文件。

## 导入方向

- 客户端组件可以从 `src/lib/` 导入客户端安全的类型和纯函数。
- 客户端组件不得导入 `src/db/`、`src/server/`、`next/headers` 或其他仅服务端模块。
- 服务端页面可以执行小型、路由局部的读取；共享查询和投影流程应进入 `src/server/`，参考 `src/server/directory/`。
- 跨层 DTO 类型只能有一个所有者，不要在多个组件中重复创建数据库形状的接口。

## 示例

- 服务端/客户端拆分：`src/app/page.tsx` -> `src/components/HomeTabs.tsx`。
- 共享表单外壳：`src/components/forms/FormSection.tsx`、`FormTextField.tsx`、`FormSubmitBar.tsx`。
- 领域表单归属：`src/components/SiteForm.tsx` 拥有模型覆盖和价格逻辑；`ResourceForm.tsx` 拥有标签编辑。
- 表单边界：`src/lib/admin/forms/site-form-payload.ts` 把 `FormData` 和受控状态转换为请求负载。

## 禁止做法

- 不要把数据库查询移入客户端组件。
- 不要在缺少稳定复用边界时创建泛化的 `components/common` 收纳目录。
- 不要把路由目标、删除语义或确认文案隐藏在通用表单原语中。
- 已有 `src/lib/admin/forms/` 序列化器时，不要在客户端封装中再实现一份。
