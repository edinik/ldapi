CREATE TABLE `admin_users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `admin_users_username_unique` ON `admin_users` (`username`);--> statement-breakpoint
CREATE TABLE `models` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`developer` text,
	`model_id` text,
	`icon` text,
	`official_url` text,
	`model_group` text,
	`type` text,
	`notes` text,
	`supports_tool_calling` integer DEFAULT false,
	`supports_vision` integer DEFAULT false,
	`supports_temperature_control` integer DEFAULT false,
	`supports_reasoning` integer DEFAULT false,
	`reasoning_effort_levels` text,
	`supports_web_search` integer DEFAULT false,
	`input_text` integer DEFAULT true,
	`input_image` integer DEFAULT false,
	`input_audio` integer DEFAULT false,
	`input_video` integer DEFAULT false,
	`output_text` integer DEFAULT true,
	`output_image` integer DEFAULT false,
	`output_audio` integer DEFAULT false,
	`output_video` integer DEFAULT false,
	`input_cost_per_m_tokens` real,
	`output_cost_per_m_tokens` real,
	`cache_read_cost_per_m_tokens` real,
	`cache_write_cost_per_m_tokens` real,
	`context_window` integer,
	`max_output_tokens` integer,
	`knowledge_cutoff` text,
	`release_date` text,
	`last_updated` text,
	`is_active` integer DEFAULT true,
	`show_on_home` integer DEFAULT false,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `models_name_unique` ON `models` (`name`);--> statement-breakpoint
CREATE UNIQUE INDEX `models_model_id_unique` ON `models` (`model_id`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` integer NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `admin_users`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `site_models` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`site_id` integer NOT NULL,
	`model_id` integer NOT NULL,
	`supports_tool_calling_override` integer,
	`supports_vision_override` integer,
	`supports_temperature_control_override` integer,
	`supports_reasoning_override` integer,
	`reasoning_effort_levels_override` text,
	`supports_web_search_override` integer,
	`rating` text,
	FOREIGN KEY (`site_id`) REFERENCES `sites`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`model_id`) REFERENCES `models`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `sites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`description` text,
	`admin_profile_url` text,
	`discussion_url` text,
	`has_check_in` integer DEFAULT false,
	`auto_check_in` integer DEFAULT false,
	`check_in_url` text,
	`supports_claude_code` integer DEFAULT false,
	`supports_codex` integer DEFAULT false,
	`supports_immersive_translation` integer DEFAULT false,
	`welfare_url` text,
	`status_url` text,
	`has_rate_limit` integer DEFAULT false,
	`rate_limit_info` text,
	`has_activity_requirement` integer DEFAULT false,
	`activity_requirement_info` text,
	`is_active` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer
);
