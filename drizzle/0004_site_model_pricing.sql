ALTER TABLE `site_models` ADD `pricing_mode` text;
--> statement-breakpoint
ALTER TABLE `site_models` ADD `usage_price_source` text;
--> statement-breakpoint
ALTER TABLE `site_models` ADD `price_multiplier` real;
--> statement-breakpoint
ALTER TABLE `site_models` ADD `input_cost_per_m_tokens_override` real;
--> statement-breakpoint
ALTER TABLE `site_models` ADD `output_cost_per_m_tokens_override` real;
--> statement-breakpoint
ALTER TABLE `site_models` ADD `cache_read_cost_per_m_tokens_override` real;
--> statement-breakpoint
ALTER TABLE `site_models` ADD `cache_write_cost_per_m_tokens_override` real;
--> statement-breakpoint
ALTER TABLE `site_models` ADD `per_request_cost` real;
--> statement-breakpoint
ALTER TABLE `site_models` ADD `pricing_notes` text;
