-- V2: Add missing tables (diem_danh, HOC_BA), missing indexes, and FK improvements

-- ===================== MISSING TABLES =====================

CREATE TABLE IF NOT EXISTS `diem_danh` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ngay` DATE NOT NULL,
  `lop_hoc_id` INT NOT NULL,
  `hoc_sinh_id` INT NOT NULL,
  `co_phep` BIT(1) DEFAULT 0,
  `khong_phep` BIT(1) DEFAULT 0,
  `so_ngay_vang` INT DEFAULT 0,
  `ghi_chu` VARCHAR(255) NULL,
  `giao_vien_id` INT NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY `uk_diemdanh` (`ngay`, `lop_hoc_id`, `hoc_sinh_id`),
  CONSTRAINT `fk_diemdanh_lop` FOREIGN KEY (`lop_hoc_id`) REFERENCES `lop`(`id`),
  CONSTRAINT `fk_diemdanh_hocsinh` FOREIGN KEY (`hoc_sinh_id`) REFERENCES `hoc_sinh`(`id`),
  CONSTRAINT `fk_diemdanh_giaovien` FOREIGN KEY (`giao_vien_id`) REFERENCES `giao_vien`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `HOC_BA` (
  `ID_HOCBA` INT AUTO_INCREMENT PRIMARY KEY,
  `ID_HOCSINH` INT NOT NULL,
  `ID_NAMHOC` INT NULL,
  `HOC_LUC` VARCHAR(20) NULL,
  `HANH_KIEM` VARCHAR(20) NULL,
  `GHI_CHU` VARCHAR(255) NULL,
  CONSTRAINT `fk_hocba_hocsinh` FOREIGN KEY (`ID_HOCSINH`) REFERENCES `hoc_sinh`(`id`),
  CONSTRAINT `fk_hocba_namhoc` FOREIGN KEY (`ID_NAMHOC`) REFERENCES `nam_hoc`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================== MISSING INDEXES ON FK COLUMNS =====================
-- MySQL InnoDB requires explicit indexes on FK columns for JOIN performance

-- hoc_sinh
CREATE INDEX `idx_hocsinh_lop_id` ON `hoc_sinh`(`lop_id`);
CREATE INDEX `idx_hocsinh_user_id` ON `hoc_sinh`(`user_id`);

-- giao_vien
CREATE INDEX `idx_giaovien_user_id` ON `giao_vien`(`user_id`);

-- phu_huynh
CREATE INDEX `idx_phuhuynh_user_id` ON `phu_huynh`(`user_id`);

-- diem
CREATE INDEX `idx_diem_hocsinh_id` ON `diem`(`hoc_sinh_id`);
CREATE INDEX `idx_diem_monhoc_id` ON `diem`(`mon_hoc_id`);
CREATE INDEX `idx_diem_phancong_id` ON `diem`(`phan_cong_day_id`);
CREATE INDEX `idx_diem_giaovien_nhap_id` ON `diem`(`giao_vien_nhap_id`);

-- HANH_KIEM
CREATE INDEX `idx_hanhkiem_hocsinh_id` ON `HANH_KIEM`(`ID_HOCSINH`);
CREATE INDEX `idx_hanhkiem_giaovien_id` ON `HANH_KIEM`(`ID_GIAOVIEN`);
CREATE INDEX `idx_hanhkiem_namhoc_id` ON `HANH_KIEM`(`ID_NAMHOC`);

-- lich_thi
CREATE INDEX `idx_lichthi_lop_id` ON `lich_thi`(`lop_id`);
CREATE INDEX `idx_lichthi_monhoc_id` ON `lich_thi`(`mon_hoc_id`);

-- thoi_khoa_bieu
CREATE INDEX `idx_tkb_lop_id` ON `thoi_khoa_bieu`(`lop_id`);
CREATE INDEX `idx_tkb_monhoc_id` ON `thoi_khoa_bieu`(`mon_hoc_id`);
CREATE INDEX `idx_tkb_giaovien_id` ON `thoi_khoa_bieu`(`giao_vien_id`);

-- phan_cong_day (individual columns for single-column lookups)
CREATE INDEX `idx_phancong_monhoc_id` ON `phan_cong_day`(`mon_hoc_id`);
CREATE INDEX `idx_phancong_lop_id` ON `phan_cong_day`(`lop_id`);

-- phu_huynh_hoc_sinh (hoc_sinh_id needs its own index for FK lookups)
CREATE INDEX `idx_phs_hocsinh_id` ON `phu_huynh_hoc_sinh`(`hoc_sinh_id`);

-- HOC_KY
CREATE INDEX `idx_hocky_namhoc_id` ON `HOC_KY`(`ID_NAMHOC`);

-- diem_danh
CREATE INDEX `idx_diemdanh_lop_id` ON `diem_danh`(`lop_hoc_id`);
CREATE INDEX `idx_diemdanh_hocsinh_id` ON `diem_danh`(`hoc_sinh_id`);
CREATE INDEX `idx_diemdanh_giaovien_id` ON `diem_danh`(`giao_vien_id`);

-- HOC_BA
CREATE INDEX `idx_hocba_hocsinh_id` ON `HOC_BA`(`ID_HOCSINH`);
CREATE INDEX `idx_hocba_namhoc_id` ON `HOC_BA`(`ID_NAMHOC`);

-- audit_log (user_id for lookups)
CREATE INDEX `idx_auditlog_user_id` ON `audit_log`(`user_id`);

-- ===================== SYNC RoleEnum.VAN_THU WITH DB =====================
INSERT IGNORE INTO `ROLES` (`ID_ROLES`, `ROLE_NAME`) VALUES
  (1, 'ADMIN'),
  (2, 'GIAO_VIEN'),
  (3, 'HOC_SINH'),
  (4, 'PHU_HUYNH'),
  (5, 'VAN_THU');
