-- V3: Add token blacklist table for JWT logout support

CREATE TABLE IF NOT EXISTS `token_blacklist` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `token` VARCHAR(512) NOT NULL,
  `expiry_date` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_blacklist_token` (`token`(191)),
  INDEX `idx_blacklist_expiry` (`expiry_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
