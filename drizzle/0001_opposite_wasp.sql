CREATE TABLE `resources` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text DEFAULT 'tutorial' NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`tags` text DEFAULT '[]' NOT NULL,
	`github_url` text,
	`official_url` text,
	`demo_url` text,
	`linuxdo_url` text,
	`recommendation` text,
	`is_active` integer DEFAULT true,
	`created_at` integer,
	`updated_at` integer
);
