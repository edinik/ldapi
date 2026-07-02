import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
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
  developer: text("developer"),
  modelId: text("model_id").unique(),
  icon: text("icon"),
  officialUrl: text("official_url"),
  group: text("model_group"),
  type: text("type"),
  notes: text("notes"),
  supportsToolCalling: integer("supports_tool_calling", { mode: "boolean" }).default(false),
  supportsVision: integer("supports_vision", { mode: "boolean" }).default(false),
  supportsTemperatureControl: integer("supports_temperature_control", { mode: "boolean" }).default(false),
  supportsReasoning: integer("supports_reasoning", { mode: "boolean" }).default(false),
  reasoningEffortLevels: text("reasoning_effort_levels"),
  supportsWebSearch: integer("supports_web_search", { mode: "boolean" }).default(false),
  inputText: integer("input_text", { mode: "boolean" }).default(true),
  inputImage: integer("input_image", { mode: "boolean" }).default(false),
  inputAudio: integer("input_audio", { mode: "boolean" }).default(false),
  inputVideo: integer("input_video", { mode: "boolean" }).default(false),
  outputText: integer("output_text", { mode: "boolean" }).default(true),
  outputImage: integer("output_image", { mode: "boolean" }).default(false),
  outputAudio: integer("output_audio", { mode: "boolean" }).default(false),
  outputVideo: integer("output_video", { mode: "boolean" }).default(false),
  inputCostPerMTokens: real("input_cost_per_m_tokens"),
  outputCostPerMTokens: real("output_cost_per_m_tokens"),
  cacheReadCostPerMTokens: real("cache_read_cost_per_m_tokens"),
  cacheWriteCostPerMTokens: real("cache_write_cost_per_m_tokens"),
  contextWindow: integer("context_window"),
  maxOutputTokens: integer("max_output_tokens"),
  knowledgeCutoff: text("knowledge_cutoff"),
  releaseDate: text("release_date"),
  lastUpdated: text("last_updated"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  showOnHome: integer("show_on_home", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const resources = sqliteTable("resources", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  type: text("type").notNull().default("tutorial"),
  title: text("title").notNull(),
  description: text("description"),
  tags: text("tags").notNull().default("[]"),
  githubUrl: text("github_url"),
  officialUrl: text("official_url"),
  demoUrl: text("demo_url"),
  linuxdoUrl: text("linuxdo_url"),
  recommendation: text("recommendation"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const siteModels = sqliteTable("site_models", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  siteId: integer("site_id").notNull().references(() => sites.id, { onDelete: "cascade" }),
  modelId: integer("model_id").notNull().references(() => models.id, { onDelete: "cascade" }),
  supportsToolCallingOverride: integer("supports_tool_calling_override", { mode: "boolean" }),
  supportsVisionOverride: integer("supports_vision_override", { mode: "boolean" }),
  supportsTemperatureControlOverride: integer("supports_temperature_control_override", { mode: "boolean" }),
  supportsReasoningOverride: integer("supports_reasoning_override", { mode: "boolean" }),
  reasoningEffortLevelsOverride: text("reasoning_effort_levels_override"),
  supportsWebSearchOverride: integer("supports_web_search_override", { mode: "boolean" }),
  rating: text("rating"),
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
  totpSecret: text("totp_secret"),
  pendingTotpSecret: text("pending_totp_secret"),
  createdAt: integer("created_at", { mode: "timestamp" }).$defaultFn(() => new Date()),
});

export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => adminUsers.id),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});
