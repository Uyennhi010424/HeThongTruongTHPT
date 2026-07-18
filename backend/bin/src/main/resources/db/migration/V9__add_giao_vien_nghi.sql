-- Bang ghi nhan giao vien nghi day
CREATE TABLE IF NOT EXISTS `giao_vien_nghi` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `giao_vien_id` INT NOT NULL,
  `ngay` DATE NOT NULL,
  `nam_hoc` VARCHAR(9) NOT NULL,
  `ly_do` VARCHAR(255) NULL,
  `ghi_chu` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_gvn_giaovien` FOREIGN KEY (`giao_vien_id`) REFERENCES `giao_vien`(`id`),
  UNIQUE KEY `uk_gvn_giaovien_ngay` (`giao_vien_id`, `ngay`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_gvn_ngay` ON `giao_vien_nghi`(`ngay`);
CREATE INDEX `idx_gvn_nam_hoc` ON `giao_vien_nghi`(`nam_hoc`);
CREATE INDEX `idx_gvn_giao_vien_id` ON `giao_vien_nghi`(`giao_vien_id`);

-- Bang ghi nhan day thay cho TKB
CREATE TABLE IF NOT EXISTS `tkb_day_thay` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tkb_id` INT NOT NULL,
  `giao_vien_thay_id` INT NOT NULL,
  `ngay` DATE NOT NULL,
  `ghi_chu` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_dtt_tkb` FOREIGN KEY (`tkb_id`) REFERENCES `thoi_khoa_bieu`(`id`),
  CONSTRAINT `fk_dtt_giaovien` FOREIGN KEY (`giao_vien_thay_id`) REFERENCES `giao_vien`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE INDEX `idx_dtt_ngay` ON `tkb_day_thay`(`ngay`);
CREATE INDEX `idx_dtt_tkb_id` ON `tkb_day_thay`(`tkb_id`);
CREATE INDEX `idx_dtt_giao_vien_thay_id` ON `tkb_day_thay`(`giao_vien_thay_id`);
