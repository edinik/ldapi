ALTER TABLE `admin_users` ADD `totp_secret` text;--> statement-breakpoint
ALTER TABLE `admin_users` ADD `pending_totp_secret` text;