-- Flyway baseline migration: Create all tables
-- This script reflects the current production schema

-- ===================== CORE TABLES =====================

CREATE TABLE IF NOT EXISTS `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(20) NOT NULL,
  `is_active` BIT(1) NOT NULL DEFAULT 1,
  `last_login` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `nam_hoc` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ten_nam_hoc` VARCHAR(9) NOT NULL UNIQUE,
  `ngay_bat_dau_hk1` DATE NOT NULL,
  `ngay_ket_thuc_hk1` DATE NOT NULL,
  `ngay_bat_dau_hk2` DATE NOT NULL,
  `ngay_ket_thuc_hk2` DATE NOT NULL,
  `deadline_nhap_diem_hk1` DATE NOT NULL,
  `deadline_nhap_diem_hk2` DATE NOT NULL,
  `trang_thai` VARCHAR(255) NOT NULL DEFAULT 'DANG_MO'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `HOC_KY` (
  `ID_HOCKY` INT PRIMARY KEY,
  `ID_NAMHOC` INT NULL,
  `TEN_HOCKY` VARCHAR(20) NULL,
  CONSTRAINT `fk_hocky_namhoc` FOREIGN KEY (`ID_NAMHOC`) REFERENCES `nam_hoc`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `giao_vien` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `ma_giao_vien` VARCHAR(20) NOT NULL UNIQUE,
  `ho_ten` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100) NULL UNIQUE,
  `so_dien_thoai` VARCHAR(15) NULL,
  `bo_mon` VARCHAR(100) NULL,
  `trinh_do` VARCHAR(100) NULL,
  `gioi_tinh` BIT(1) NULL,
  `ngay_sinh` DATE NULL,
  `dia_chi` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_giaovien_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lop` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ten_lop` VARCHAR(20) NOT NULL,
  `khoi` INT NOT NULL,
  `nam_hoc` VARCHAR(9) NOT NULL,
  `gvcn_id` INT NULL,
  `si_so` INT NOT NULL DEFAULT 0,
  `phong_hoc` VARCHAR(10) NULL,
  UNIQUE KEY `uk_lop_ten_namhoc` (`ten_lop`, `nam_hoc`),
  CONSTRAINT `fk_lop_gvcn` FOREIGN KEY (`gvcn_id`) REFERENCES `giao_vien`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `hoc_sinh` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `ma_hoc_sinh` VARCHAR(20) NOT NULL UNIQUE,
  `ho_ten` VARCHAR(100) NOT NULL,
  `ngay_sinh` DATE NOT NULL,
  `gioi_tinh` VARCHAR(255) NOT NULL,
  `lop_id` INT NULL,
  `dia_chi` VARCHAR(255) NULL,
  `nam_nhap_hoc` INT NOT NULL,
  `sdt` VARCHAR(20) NULL,
  `email` VARCHAR(100) NULL,
  `dan_toc` VARCHAR(255) NULL,
  `ton_giao` VARCHAR(255) NULL,
  `ma_bhyt` VARCHAR(50) NULL,
  `dien_chinh_sach` BIT(1) DEFAULT 0,
  `trang_thai` INT DEFAULT 1,
  `anh_dai_dien` TEXT NULL,
  `fcm_token` VARCHAR(500) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_hocsinh_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`),
  CONSTRAINT `fk_hocsinh_lop` FOREIGN KEY (`lop_id`) REFERENCES `lop`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `mon_hoc` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `ten_mon` VARCHAR(100) NOT NULL UNIQUE,
  `ma_mon` VARCHAR(20) NOT NULL UNIQUE,
  `nhom_danh_gia` VARCHAR(255) NOT NULL,
  `so_dtx_hoc_ky` INT NOT NULL,
  `khoi_ap_dung` VARCHAR(20) NOT NULL,
  `mo_ta` VARCHAR(255) NULL,
  `is_active` BIT(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================== RELATIONSHIP TABLES =====================

CREATE TABLE IF NOT EXISTS `phu_huynh` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `user_id` INT NOT NULL,
  `ho_ten` VARCHAR(100) NOT NULL,
  `so_dien_thoai` VARCHAR(15) NOT NULL,
  `email` VARCHAR(100) NULL,
  `nghe_nghiep` VARCHAR(200) NULL,
  `quan_he` VARCHAR(255) NOT NULL,
  `is_sms_active` BIT(1) NOT NULL DEFAULT 1,
  CONSTRAINT `fk_phuhuynh_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `phu_huynh_hoc_sinh` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `phu_huynh_id` INT NOT NULL,
  `hoc_sinh_id` INT NOT NULL,
  `quan_he` VARCHAR(255) NOT NULL,
  `la_nguoi_lien_he_chinh` BIT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY `uk_ph_hs` (`phu_huynh_id`, `hoc_sinh_id`),
  CONSTRAINT `fk_phs_phuhuynh` FOREIGN KEY (`phu_huynh_id`) REFERENCES `phu_huynh`(`id`),
  CONSTRAINT `fk_phs_hocsinh` FOREIGN KEY (`hoc_sinh_id`) REFERENCES `hoc_sinh`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `phan_cong_day` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `giao_vien_id` INT NOT NULL,
  `mon_hoc_id` INT NOT NULL,
  `lop_id` INT NOT NULL,
  `hoc_ky` INT NOT NULL,
  `nam_hoc` VARCHAR(9) NOT NULL,
  `ngay_bat_dau` DATE NULL,
  UNIQUE KEY `uk_phancong` (`giao_vien_id`, `mon_hoc_id`, `lop_id`, `hoc_ky`),
  CONSTRAINT `fk_phancong_giaovien` FOREIGN KEY (`giao_vien_id`) REFERENCES `giao_vien`(`id`),
  CONSTRAINT `fk_phancong_monhoc` FOREIGN KEY (`mon_hoc_id`) REFERENCES `mon_hoc`(`id`),
  CONSTRAINT `fk_phancong_lop` FOREIGN KEY (`lop_id`) REFERENCES `lop`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================== ACADEMIC DATA TABLES =====================

CREATE TABLE IF NOT EXISTS `diem` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `hoc_sinh_id` INT NOT NULL,
  `mon_hoc_id` INT NOT NULL,
  `phan_cong_day_id` INT NOT NULL,
  `loai_diem` VARCHAR(255) NOT NULL,
  `so_thu_tu` INT NOT NULL DEFAULT 0,
  `hoc_ky` INT NOT NULL,
  `nam_hoc` VARCHAR(9) NOT NULL,
  `gia_tri` DECIMAL(4,1) NULL,
  `nhan_xet` VARCHAR(255) NULL,
  `status` VARCHAR(255) NOT NULL DEFAULT 'DRAFT',
  `ngay_nhap` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `giao_vien_nhap_id` INT NOT NULL,
  `ghi_chu` VARCHAR(255) NULL,
  UNIQUE KEY `uk_diem` (`hoc_sinh_id`, `mon_hoc_id`, `loai_diem`, `so_thu_tu`, `hoc_ky`, `nam_hoc`),
  CONSTRAINT `fk_diem_hocsinh` FOREIGN KEY (`hoc_sinh_id`) REFERENCES `hoc_sinh`(`id`),
  CONSTRAINT `fk_diem_monhoc` FOREIGN KEY (`mon_hoc_id`) REFERENCES `mon_hoc`(`id`),
  CONSTRAINT `fk_diem_phancong` FOREIGN KEY (`phan_cong_day_id`) REFERENCES `phan_cong_day`(`id`),
  CONSTRAINT `fk_diem_giaovien` FOREIGN KEY (`giao_vien_nhap_id`) REFERENCES `giao_vien`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `HANH_KIEM` (
  `ID_HANHKIEM` INT AUTO_INCREMENT PRIMARY KEY,
  `ID_HOCSINH` INT NOT NULL,
  `ID_GIAOVIEN` INT NULL,
  `ID_NAMHOC` INT NULL,
  `HOC_KY` INT NULL,
  `XEP_LOAI` VARCHAR(50) NULL,
  `NHAN_XET` VARCHAR(255) NULL,
  `NGAY_DANH_GIA` DATE NULL,
  CONSTRAINT `fk_hanhkiem_hocsinh` FOREIGN KEY (`ID_HOCSINH`) REFERENCES `hoc_sinh`(`id`),
  CONSTRAINT `fk_hanhkiem_giaovien` FOREIGN KEY (`ID_GIAOVIEN`) REFERENCES `giao_vien`(`id`),
  CONSTRAINT `fk_hanhkiem_namhoc` FOREIGN KEY (`ID_NAMHOC`) REFERENCES `nam_hoc`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `lich_thi` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lop_id` INT NOT NULL,
  `mon_hoc_id` INT NOT NULL,
  `loai_kiem_tra` VARCHAR(255) NOT NULL,
  `ngay_thi` DATE NOT NULL,
  `gio_bat_dau` TIME NOT NULL,
  `thoi_gian_lam_bai` INT NOT NULL,
  `phong_thi` VARCHAR(20) NULL,
  `ghi_chu` VARCHAR(255) NULL,
  `hoc_ky` INT NOT NULL,
  `nam_hoc` VARCHAR(9) NOT NULL,
  CONSTRAINT `fk_lichthi_lop` FOREIGN KEY (`lop_id`) REFERENCES `lop`(`id`),
  CONSTRAINT `fk_lichthi_monhoc` FOREIGN KEY (`mon_hoc_id`) REFERENCES `mon_hoc`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `thoi_khoa_bieu` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `lop_id` INT NOT NULL,
  `mon_hoc_id` INT NOT NULL,
  `giao_vien_id` INT NOT NULL,
  `thu` INT NOT NULL,
  `tiet_bat_dau` INT NOT NULL,
  `so_tiet` INT NOT NULL,
  `phong_hoc` VARCHAR(10) NULL,
  `hoc_ky` INT NOT NULL,
  `nam_hoc` VARCHAR(9) NOT NULL,
  CONSTRAINT `fk_tkb_lop` FOREIGN KEY (`lop_id`) REFERENCES `lop`(`id`),
  CONSTRAINT `fk_tkb_monhoc` FOREIGN KEY (`mon_hoc_id`) REFERENCES `mon_hoc`(`id`),
  CONSTRAINT `fk_tkb_giaovien` FOREIGN KEY (`giao_vien_id`) REFERENCES `giao_vien`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===================== SYSTEM TABLES =====================

CREATE TABLE IF NOT EXISTS `ROLES` (
  `ID_ROLES` INT PRIMARY KEY,
  `ROLE_NAME` VARCHAR(30) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `admin_config` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `config_key` VARCHAR(100) NOT NULL UNIQUE,
  `config_value` TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_log` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `action` VARCHAR(100) NOT NULL,
  `entity_type` VARCHAR(50) NULL,
  `entity_id` INT NULL,
  `user_id` INT NULL,
  `details` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `thong_bao` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tieu_de` VARCHAR(255) NOT NULL,
  `noi_dung` TEXT NOT NULL,
  `doi_tuong` VARCHAR(50) NOT NULL,
  `ngay_dang` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
