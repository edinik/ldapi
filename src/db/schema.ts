import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const sites = sqliteTable("sites", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  // 基本信息
  name: text("name").notNull(),
  url: text("url").notNull(),
  description: text("description"),
  // LinuxDo 相关
  adminProfileUrl: text("admin_profile_url"), // 站长主页
  discussionUrl: text("discussion_url"), // 讨论主贴
  // 签到相关
  hasCheckIn: integer("has_check_in", { mode: "boolean" }).default(false),
  autoCheckIn: integer("auto_check_in", { mode: "boolean" }).default(false),
  checkInUrl: text("check_in_url"), // 签到站地址
  // 功能支持
  supportsClaudeCode: integer("supports_claude_code", { mode: "boolean" }).default(false),
  supportsCodex: integer("supports_codex", { mode: "boolean" }).default(false),
  supportsImmersiveTranslation: integer("supports_immersive_translation", { mode: "boolean" }).default(false),
  // 附属站点
  welfareUrl: text("welfare_url"), // 福利站
  statusUrl: text("status_url"), // 状态监控站
  // 限速
  hasRateLimit: integer("has_rate_limit", { mode: "boolean" }).default(false),
  rateLimitInfo: text("rate_limit_info"), // 限速详情描述
  // 活跃度要求
  hasActivityRequirement: integer("has_activity_requirement", { mode: "boolean" }).default(false),
  activityRequirementInfo: text("activity_requirement_info"), // 如"30天不活跃删号"
  // 元数据
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const models = sqliteTable("models", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
});

export const siteModels = sqliteTable("site_models", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  modelId: integer("model_id").notNull().references(() => models.id, { onDelete: "cascade" }),
});

// Relations
export const sitesRelations = relations(sites, ({ many }) => ({
  siteModels: many(siteModels),
}));

export const modelsRelations = relations(models, ({ many }) => ({
  siteModels: many(siteModels),
}));

export const siteModelsRelations = relations(siteModels, ({ one }) => ({
  site: one(sites, { fields: [siteModels.siteId], references: [sites.id] }),
  model: one(models, { fields: [siteModels.modelId], references: [models.id] }),
}));

export const adminUsers = sqliteTable("admin_users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => adminUsers.id),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});
