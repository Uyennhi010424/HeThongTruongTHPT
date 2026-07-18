DROP TABLE IF EXISTS `admin_config`;
CREATE TABLE `admin_config` (
  `id` int NOT NULL AUTO_INCREMENT,
  `config_key` varchar(100) NOT NULL,
  `config_value` text NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `updated_by` int DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cfg_key` (`config_key`),
  KEY `fk_cfg_user` (`updated_by`),
  CONSTRAINT `fk_cfg_user` FOREIGN KEY (`updated_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `ai_suggestions`;
CREATE TABLE `ai_suggestions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `hoc_sinh_id` int NOT NULL,
  `noi_dung_json` text NOT NULL,
  `hoc_ky` int NOT NULL,
  `nam_hoc` varchar(9) NOT NULL,
  `ngay_tao` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `het_han` datetime NOT NULL,
  `mo_hinh_ai` varchar(50) NOT NULL DEFAULT 'gemini-1.5-flash',
  PRIMARY KEY (`id`),
  KEY `idx_ai_het_han` (`het_han`),
  KEY `idx_ai_hs_hk` (`hoc_sinh_id`,`hoc_ky`,`nam_hoc`),
  CONSTRAINT `fk_ai_hs` FOREIGN KEY (`hoc_sinh_id`) REFERENCES `hoc_sinh` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `ap_dung`;
CREATE TABLE `ap_dung` (
  `id_diem` int NOT NULL,
  `id_hocky` int NOT NULL,
  PRIMARY KEY (`id_diem`,`id_hocky`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `ap_dung_trong`;
CREATE TABLE `ap_dung_trong` (
  `id_lichthi` int NOT NULL,
  `id_lop` int NOT NULL,
  `id_namhoc` int NOT NULL,
  `id_tkb` int NOT NULL,
  PRIMARY KEY (`id_lichthi`,`id_lop`,`id_namhoc`,`id_tkb`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `bao_gom`;
CREATE TABLE `bao_gom` (
  `id_hocky` int NOT NULL,
  `id_lichthi` int NOT NULL,
  `id_namhoc` int NOT NULL,
  `id_tkb` int NOT NULL,
  PRIMARY KEY (`id_hocky`,`id_lichthi`,`id_namhoc`,`id_tkb`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `chu_nhiem`;
CREATE TABLE `chu_nhiem` (
  `id_giaovien` int NOT NULL,
  `id_lop` int NOT NULL,
  PRIMARY KEY (`id_giaovien`,`id_lop`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `co`;
CREATE TABLE `co` (
  `id_hocsinh` int NOT NULL,
  `id_quoctich` int NOT NULL,
  PRIMARY KEY (`id_hocsinh`,`id_quoctich`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `dan_toc`;
CREATE TABLE `dan_toc` (
  `id_dantoc` int NOT NULL AUTO_INCREMENT,
  `mo_ta` varchar(255) DEFAULT NULL,
  `ten_dantoc` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_dantoc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `dang_tao`;
CREATE TABLE `dang_tao` (
  `id_thongbao` int NOT NULL,
  `id_user` int NOT NULL,
  PRIMARY KEY (`id_thongbao`,`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `danh_gia`;
CREATE TABLE `danh_gia` (
  `id_diem` int NOT NULL,
  `id_monhoc` int NOT NULL,
  PRIMARY KEY (`id_diem`,`id_monhoc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `danh_gia_hk`;
CREATE TABLE `danh_gia_hk` (
  `id_giaovien` int NOT NULL,
  `id_hanhkiem` int NOT NULL,
  `id_khenthuong` int NOT NULL,
  `id_vipham` int NOT NULL,
  PRIMARY KEY (`id_giaovien`,`id_hanhkiem`,`id_khenthuong`,`id_vipham`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `dat`;
CREATE TABLE `dat` (
  `id_diem` int NOT NULL,
  `id_hocsinh` int NOT NULL,
  PRIMARY KEY (`id_diem`,`id_hocsinh`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `diem`;
CREATE TABLE `diem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `hoc_sinh_id` int NOT NULL,
  `mon_hoc_id` int NOT NULL,
  `phan_cong_day_id` int NOT NULL,
  `loai_diem` varchar(255) NOT NULL,
  `so_thu_tu` int NOT NULL DEFAULT '0',
  `hoc_ky` int NOT NULL,
  `nam_hoc` varchar(9) NOT NULL,
  `gia_tri` decimal(4,1) DEFAULT NULL,
  `nhan_xet` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL,
  `ngay_nhap` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `giao_vien_nhap_id` int NOT NULL,
  `ghi_chu` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_diem_hs` (`hoc_sinh_id`,`mon_hoc_id`,`loai_diem`,`so_thu_tu`,`hoc_ky`,`nam_hoc`),
  KEY `fk_diem_mon` (`mon_hoc_id`),
  KEY `fk_diem_gvn` (`giao_vien_nhap_id`),
  KEY `idx_diem_hs_mon` (`hoc_sinh_id`,`mon_hoc_id`),
  KEY `idx_diem_hk_namhoc` (`hoc_ky`,`nam_hoc`),
  KEY `idx_diem_status` (`status`),
  KEY `idx_diem_pcd` (`phan_cong_day_id`),
  CONSTRAINT `fk_diem_gvn` FOREIGN KEY (`giao_vien_nhap_id`) REFERENCES `giao_vien` (`id`),
  CONSTRAINT `fk_diem_hs` FOREIGN KEY (`hoc_sinh_id`) REFERENCES `hoc_sinh` (`id`),
  CONSTRAINT `fk_diem_mon` FOREIGN KEY (`mon_hoc_id`) REFERENCES `mon_hoc` (`id`),
  CONSTRAINT `fk_diem_pcd` FOREIGN KEY (`phan_cong_day_id`) REFERENCES `phan_cong_day` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `diem_audit_log`;
CREATE TABLE `diem_audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `diem_id` int NOT NULL,
  `hoc_sinh_id` int NOT NULL,
  `mon_hoc_id` int NOT NULL,
  `gia_tri_cu` decimal(4,1) DEFAULT NULL,
  `gia_tri_moi` decimal(4,1) DEFAULT NULL,
  `hanh_dong` varchar(255) NOT NULL,
  `giao_vien_id` int NOT NULL,
  `thoi_gian` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ly_do` text,
  `ip_address` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_dal_diem` (`diem_id`),
  KEY `fk_dal_mon` (`mon_hoc_id`),
  KEY `fk_dal_gv` (`giao_vien_id`),
  KEY `idx_dal_hs_mon` (`hoc_sinh_id`,`mon_hoc_id`),
  KEY `idx_dal_thoi_gian` (`thoi_gian`),
  CONSTRAINT `fk_dal_diem` FOREIGN KEY (`diem_id`) REFERENCES `diem` (`id`),
  CONSTRAINT `fk_dal_gv` FOREIGN KEY (`giao_vien_id`) REFERENCES `giao_vien` (`id`),
  CONSTRAINT `fk_dal_hs` FOREIGN KEY (`hoc_sinh_id`) REFERENCES `hoc_sinh` (`id`),
  CONSTRAINT `fk_dal_mon` FOREIGN KEY (`mon_hoc_id`) REFERENCES `mon_hoc` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `duoc_ban_hanh_boi`;
CREATE TABLE `duoc_ban_hanh_boi` (
  `id_user` int NOT NULL,
  `id_vanban` int NOT NULL,
  PRIMARY KEY (`id_user`,`id_vanban`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `duoc_danh_gia`;
CREATE TABLE `duoc_danh_gia` (
  `id_hanhkiem` int NOT NULL,
  `id_hocsinh` int NOT NULL,
  `id_khenthuong` int NOT NULL,
  `id_vipham` int NOT NULL,
  PRIMARY KEY (`id_hanhkiem`,`id_hocsinh`,`id_khenthuong`,`id_vipham`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `ghi_nhan_trong`;
CREATE TABLE `ghi_nhan_trong` (
  `id_diem` int NOT NULL,
  `id_namhoc` int NOT NULL,
  PRIMARY KEY (`id_diem`,`id_namhoc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `giao_vien`;
CREATE TABLE `giao_vien` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `ma_giao_vien` varchar(20) NOT NULL,
  `ho_ten` varchar(100) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `so_dien_thoai` varchar(15) DEFAULT NULL,
  `ngay_sinh` date DEFAULT NULL,
  `dia_chi` text,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `bo_mon` varchar(100) DEFAULT NULL,
  `gioi_tinh` bit(1) DEFAULT NULL,
  `trinh_do` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_gv_ma` (`ma_giao_vien`),
  UNIQUE KEY `uq_gv_email` (`email`),
  KEY `fk_gv_user` (`user_id`),
  CONSTRAINT `fk_gv_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `hanh_kiem`;
CREATE TABLE `hanh_kiem` (
  `id_hanhkiem` int NOT NULL AUTO_INCREMENT,
  `ngay_danh_gia` date DEFAULT NULL,
  `nhan_xet` varchar(255) DEFAULT NULL,
  `xep_loai` enum('TOT','KHA','TRUNG_BINH','YEU') DEFAULT NULL,
  `id_giaovien` int DEFAULT NULL,
  `id_hocsinh` int NOT NULL,
  `id_namhoc` int DEFAULT NULL,
  PRIMARY KEY (`id_hanhkiem`),
  KEY `FK2c1ixrntgjg3upsylcvesuemg` (`id_giaovien`),
  KEY `FKrd8pij9lo330ue60rvbocwqc6` (`id_hocsinh`),
  KEY `FKog5o1vr32263vvhtqwbs6lejc` (`id_namhoc`),
  CONSTRAINT `FK2c1ixrntgjg3upsylcvesuemg` FOREIGN KEY (`id_giaovien`) REFERENCES `giao_vien` (`id`),
  CONSTRAINT `FKog5o1vr32263vvhtqwbs6lejc` FOREIGN KEY (`id_namhoc`) REFERENCES `nam_hoc` (`id`),
  CONSTRAINT `FKrd8pij9lo330ue60rvbocwqc6` FOREIGN KEY (`id_hocsinh`) REFERENCES `hoc_sinh` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `hoc_ba`;
CREATE TABLE `hoc_ba` (
  `id_hocba` int NOT NULL,
  `ghi_chu` varchar(255) DEFAULT NULL,
  `hanh_kiem` varchar(20) DEFAULT NULL,
  `hoc_luc` varchar(20) DEFAULT NULL,
  `id_namhoc` int DEFAULT NULL,
  `id_hocsinh` int NOT NULL,
  PRIMARY KEY (`id_hocba`),
  KEY `FK6bn7vdhuwmshtsibvs821u4tj` (`id_hocsinh`),
  KEY `FKj8pibjiupaouptm949s6jukal` (`id_namhoc`),
  CONSTRAINT `FK6bn7vdhuwmshtsibvs821u4tj` FOREIGN KEY (`id_hocsinh`) REFERENCES `hoc_sinh` (`id`),
  CONSTRAINT `FKj8pibjiupaouptm949s6jukal` FOREIGN KEY (`id_namhoc`) REFERENCES `nam_hoc` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `hoc_ky`;
CREATE TABLE `hoc_ky` (
  `id_hocky` int NOT NULL,
  `ten_hocky` varchar(20) DEFAULT NULL,
  `id_namhoc` int DEFAULT NULL,
  PRIMARY KEY (`id_hocky`),
  KEY `FKnjcgll0u8ci3wrxtp9p32ojc4` (`id_namhoc`),
  CONSTRAINT `FKnjcgll0u8ci3wrxtp9p32ojc4` FOREIGN KEY (`id_namhoc`) REFERENCES `nam_hoc` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `hoc_sinh`;
CREATE TABLE `hoc_sinh` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `ma_hoc_sinh` varchar(20) NOT NULL,
  `ho_ten` varchar(100) NOT NULL,
  `ngay_sinh` date NOT NULL,
  `gioi_tinh` varchar(255) NOT NULL,
  `lop_id` int DEFAULT NULL,
  `dia_chi` text,
  `nam_nhap_hoc` int NOT NULL,
  `anh_dai_dien` varchar(255) DEFAULT NULL,
  `fcm_token` varchar(500) DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `dan_toc` varchar(255) DEFAULT NULL,
  `dien_chinh_sach` bit(1) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `ma_bhyt` varchar(50) DEFAULT NULL,
  `sdt` varchar(20) DEFAULT NULL,
  `ton_giao` varchar(255) DEFAULT NULL,
  `trang_thai` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_hs_ma` (`ma_hoc_sinh`),
  KEY `fk_hs_user` (`user_id`),
  KEY `idx_hs_lop` (`lop_id`),
  KEY `idx_hs_nam_nhap` (`nam_nhap_hoc`),
  CONSTRAINT `fk_hs_lop` FOREIGN KEY (`lop_id`) REFERENCES `lop` (`id`),
  CONSTRAINT `fk_hs_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `khen_thuong`;
CREATE TABLE `khen_thuong` (
  `id_khenthuong` int NOT NULL AUTO_INCREMENT,
  `ngay_khen` date DEFAULT NULL,
  `noi_dung` varchar(255) DEFAULT NULL,
  `id_hocsinh` int NOT NULL,
  PRIMARY KEY (`id_khenthuong`),
  KEY `FK2tvu254do6w53472qqx9hpreb` (`id_hocsinh`),
  CONSTRAINT `FK2tvu254do6w53472qqx9hpreb` FOREIGN KEY (`id_hocsinh`) REFERENCES `hoc_sinh` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `lich_thi`;
CREATE TABLE `lich_thi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lop_id` int NOT NULL,
  `mon_hoc_id` int NOT NULL,
  `loai_kiem_tra` varchar(255) NOT NULL,
  `ngay_thi` date NOT NULL,
  `gio_bat_dau` time NOT NULL,
  `thoi_gian_lam_bai` int NOT NULL,
  `phong_thi` varchar(20) DEFAULT NULL,
  `ghi_chu` text,
  `hoc_ky` int NOT NULL,
  `nam_hoc` varchar(9) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_lt_mon` (`mon_hoc_id`),
  KEY `idx_lt_lop_hk` (`lop_id`,`hoc_ky`,`nam_hoc`),
  CONSTRAINT `fk_lt_lop` FOREIGN KEY (`lop_id`) REFERENCES `lop` (`id`),
  CONSTRAINT `fk_lt_mon` FOREIGN KEY (`mon_hoc_id`) REFERENCES `mon_hoc` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `lien_ket_tai_khoan`;
CREATE TABLE `lien_ket_tai_khoan` (
  `id_phuhuynh` int NOT NULL,
  `id_user` int NOT NULL,
  PRIMARY KEY (`id_phuhuynh`,`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `lop`;
CREATE TABLE `lop` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_lop` varchar(20) NOT NULL,
  `khoi` int NOT NULL,
  `nam_hoc` varchar(9) NOT NULL,
  `gvcn_id` int DEFAULT NULL,
  `si_so` int NOT NULL DEFAULT '0',
  `phong_hoc` varchar(10) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_lop_ten_namhoc` (`ten_lop`,`nam_hoc`),
  KEY `fk_lop_gvcn` (`gvcn_id`),
  CONSTRAINT `fk_lop_gvcn` FOREIGN KEY (`gvcn_id`) REFERENCES `giao_vien` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `lop` VALUES (1,'10A1',10,'2025-2026',NULL,35,NULL),(2,'10A2',10,'2025-2026',NULL,36,NULL),(3,'11B1',11,'2025-2026',NULL,32,NULL),(4,'12C1',12,'2025-2026',NULL,30,NULL);

DROP TABLE IF EXISTS `mon_hoc`;
CREATE TABLE `mon_hoc` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_mon` varchar(100) NOT NULL,
  `ma_mon` varchar(20) NOT NULL,
  `nhom_danh_gia` varchar(255) NOT NULL,
  `so_dtx_hoc_ky` int NOT NULL,
  `khoi_ap_dung` varchar(20) NOT NULL,
  `mo_ta` text,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_mon_ten` (`ten_mon`),
  UNIQUE KEY `uq_mon_ma` (`ma_mon`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `mon_hoc` VALUES (1,'Toán','TOAN','DIEM_SO',4,'10,11,12',NULL,1),(2,'Ngữ văn','VAN','DIEM_SO',4,'10,11,12',NULL,1),(3,'Tiếng Anh','ANH','DIEM_SO',4,'10,11,12',NULL,1),(4,'Vật lí','LY','DIEM_SO',4,'10,11,12',NULL,1),(5,'Hóa học','HOA','DIEM_SO',4,'10,11,12',NULL,1),(6,'Sinh học','SINH','DIEM_SO',4,'10,11,12',NULL,1),(7,'Lịch sử','SU','DIEM_SO',4,'10,11,12',NULL,1),(8,'Địa lí','DIA','DIEM_SO',4,'10,11,12',NULL,1);

DROP TABLE IF EXISTS `nam_hoc`;
CREATE TABLE `nam_hoc` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_nam_hoc` varchar(9) NOT NULL,
  `ngay_bat_dau_hk1` date NOT NULL,
  `ngay_ket_thuc_hk1` date NOT NULL,
  `ngay_bat_dau_hk2` date NOT NULL,
  `ngay_ket_thuc_hk2` date NOT NULL,
  `deadline_nhap_diem_hk1` date NOT NULL,
  `deadline_nhap_diem_hk2` date NOT NULL,
  `trang_thai` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `nam_hoc` VALUES (1,'2023-2024','2023-09-01','2023-12-30','2024-01-05','2024-05-31','2024-01-10','2024-06-15','DA_DONG'),(2,'2024-2025','2024-09-01','2024-12-30','2025-01-05','2025-05-31','2025-01-10','2025-06-15','DA_DONG'),(3,'2025-2026','2025-09-01','2025-12-30','2026-01-05','2026-05-31','2026-01-10','2026-06-15','DANG_MO');

DROP TABLE IF EXISTS `nham_den`;
CREATE TABLE `nham_den` (
  `id_roles` int NOT NULL,
  `id_thongbao` int NOT NULL,
  PRIMARY KEY (`id_roles`,`id_thongbao`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `phan_cong_day`;
CREATE TABLE `phan_cong_day` (
  `id` int NOT NULL AUTO_INCREMENT,
  `giao_vien_id` int NOT NULL,
  `mon_hoc_id` int NOT NULL,
  `lop_id` int NOT NULL,
  `hoc_ky` int NOT NULL,
  `nam_hoc` varchar(9) NOT NULL,
  `ngay_bat_dau` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pcd` (`giao_vien_id`,`mon_hoc_id`,`lop_id`,`hoc_ky`),
  KEY `fk_pcd_mon` (`mon_hoc_id`),
  KEY `idx_pcd_namhoc_hk` (`nam_hoc`,`hoc_ky`),
  KEY `idx_pcd_lop` (`lop_id`),
  CONSTRAINT `fk_pcd_gv` FOREIGN KEY (`giao_vien_id`) REFERENCES `giao_vien` (`id`),
  CONSTRAINT `fk_pcd_lop` FOREIGN KEY (`lop_id`) REFERENCES `lop` (`id`),
  CONSTRAINT `fk_pcd_mon` FOREIGN KEY (`mon_hoc_id`) REFERENCES `mon_hoc` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `phan_cong_giang_day`;
CREATE TABLE `phan_cong_giang_day` (
  `id_giaovien` int NOT NULL,
  `id_lop` int NOT NULL,
  `id_monhoc` int NOT NULL,
  `id_namhoc` int NOT NULL,
  `id_tkb` int NOT NULL,
  PRIMARY KEY (`id_giaovien`,`id_lop`,`id_monhoc`,`id_namhoc`,`id_tkb`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `phan_quyen`;
CREATE TABLE `phan_quyen` (
  `id_roles` int NOT NULL,
  `id_user` int NOT NULL,
  PRIMARY KEY (`id_roles`,`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `phu_huynh`;
CREATE TABLE `phu_huynh` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `ho_ten` varchar(100) NOT NULL,
  `so_dien_thoai` varchar(15) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `quan_he` varchar(255) NOT NULL,
  `is_sms_active` tinyint(1) NOT NULL DEFAULT '1',
  `nghe_nghiep` varchar(200) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_ph_user` (`user_id`),
  CONSTRAINT `fk_ph_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `phu_huynh_hoc_sinh`;
CREATE TABLE `phu_huynh_hoc_sinh` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phu_huynh_id` int NOT NULL,
  `hoc_sinh_id` int NOT NULL,
  `quan_he` varchar(255) NOT NULL,
  `la_nguoi_lien_he_chinh` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_ph_hs` (`phu_huynh_id`,`hoc_sinh_id`),
  KEY `fk_phhs_hs` (`hoc_sinh_id`),
  CONSTRAINT `fk_phhs_hs` FOREIGN KEY (`hoc_sinh_id`) REFERENCES `hoc_sinh` (`id`),
  CONSTRAINT `fk_phhs_ph` FOREIGN KEY (`phu_huynh_id`) REFERENCES `phu_huynh` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `quoc_tich`;
CREATE TABLE `quoc_tich` (
  `id_quoctich` int NOT NULL AUTO_INCREMENT,
  `mo_ta` varchar(255) DEFAULT NULL,
  `ten_quoctich` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id_quoctich`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `refresh_token`;
CREATE TABLE `refresh_token` (
  `id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `device_info` varchar(255) DEFAULT NULL,
  `expired_at` datetime(6) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `is_revoked` bit(1) NOT NULL,
  `token` varchar(512) NOT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UKr4k4edos30bx9neoq81mdvwph` (`token`),
  KEY `FKjtx87i0jvq2svedphegvdwcuy` (`user_id`),
  CONSTRAINT `FKjtx87i0jvq2svedphegvdwcuy` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `roles`;
CREATE TABLE `roles` (
  `id_roles` int NOT NULL,
  `role_name` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id_roles`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `sms_log`;
CREATE TABLE `sms_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `phu_huynh_id` int NOT NULL,
  `hoc_sinh_id` int NOT NULL,
  `so_dien_thoai` varchar(15) NOT NULL,
  `noi_dung` text NOT NULL,
  `trang_thai` varchar(255) NOT NULL,
  `so_lan_thu` int NOT NULL DEFAULT '0',
  `thoi_gian_gui` datetime DEFAULT NULL,
  `ma_giao_dich` varchar(100) DEFAULT NULL,
  `thang_nam` varchar(7) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_sms_ph` (`phu_huynh_id`),
  KEY `idx_sms_trang_thai` (`trang_thai`),
  KEY `idx_sms_thang_nam` (`thang_nam`),
  KEY `idx_sms_hs` (`hoc_sinh_id`),
  CONSTRAINT `fk_sms_hs` FOREIGN KEY (`hoc_sinh_id`) REFERENCES `hoc_sinh` (`id`),
  CONSTRAINT `fk_sms_ph` FOREIGN KEY (`phu_huynh_id`) REFERENCES `phu_huynh` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `so_huu_tai_khoan`;
CREATE TABLE `so_huu_tai_khoan` (
  `id_hocsinh` int NOT NULL,
  `id_user` int NOT NULL,
  PRIMARY KEY (`id_hocsinh`,`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `su_dung_tai_khoan`;
CREATE TABLE `su_dung_tai_khoan` (
  `id_giaovien` int NOT NULL,
  `id_user` int NOT NULL,
  PRIMARY KEY (`id_giaovien`,`id_user`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `thoi_khoa_bieu`;
CREATE TABLE `thoi_khoa_bieu` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lop_id` int NOT NULL,
  `mon_hoc_id` int NOT NULL,
  `giao_vien_id` int NOT NULL,
  `thu` int NOT NULL,
  `tiet_bat_dau` int NOT NULL,
  `so_tiet` int NOT NULL,
  `phong_hoc` varchar(10) DEFAULT NULL,
  `hoc_ky` int NOT NULL,
  `nam_hoc` varchar(9) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_tkb_mon` (`mon_hoc_id`),
  KEY `idx_tkb_lop_hk` (`lop_id`,`hoc_ky`,`nam_hoc`),
  KEY `idx_tkb_gv_hk` (`giao_vien_id`,`hoc_ky`,`nam_hoc`),
  CONSTRAINT `fk_tkb_gv` FOREIGN KEY (`giao_vien_id`) REFERENCES `giao_vien` (`id`),
  CONSTRAINT `fk_tkb_lop` FOREIGN KEY (`lop_id`) REFERENCES `lop` (`id`),
  CONSTRAINT `fk_tkb_mon` FOREIGN KEY (`mon_hoc_id`) REFERENCES `mon_hoc` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `thong_bao`;
CREATE TABLE `thong_bao` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tieu_de` varchar(255) NOT NULL,
  `noi_dung` text NOT NULL,
  `loai` varchar(255) NOT NULL,
  `lop_id` int DEFAULT NULL,
  `hoc_sinh_id` int DEFAULT NULL,
  `nguoi_tao_id` int NOT NULL,
  `ngay_dang` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `han_hien_thi` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_tb_lop` (`lop_id`),
  KEY `fk_tb_hs` (`hoc_sinh_id`),
  KEY `fk_tb_nguoitao` (`nguoi_tao_id`),
  CONSTRAINT `fk_tb_hs` FOREIGN KEY (`hoc_sinh_id`) REFERENCES `hoc_sinh` (`id`),
  CONSTRAINT `fk_tb_lop` FOREIGN KEY (`lop_id`) REFERENCES `lop` (`id`),
  CONSTRAINT `fk_tb_nguoitao` FOREIGN KEY (`nguoi_tao_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `trong`;
CREATE TABLE `trong` (
  `id_hanhkiem` int NOT NULL,
  `id_hocky` int NOT NULL,
  `id_namhoc` int NOT NULL,
  PRIMARY KEY (`id_hanhkiem`,`id_hocky`,`id_namhoc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('ADMIN','GIAO_VIEN','HOC_SINH','PHU_HUYNH') NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `last_login` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_users_username` (`username`),
  KEY `idx_users_role` (`role`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `users` VALUES (1,'admin','$2a$10$T9hXNFx4rQahB.FBP9VRWO8Y3rH9iRx2EfXXOZAhMHwWFRf35yu0K','ADMIN',1,'2026-05-25 00:08:50','2026-05-25 00:08:50','2026-05-25 00:08:50'),(2,'giaovien1','$2a$10$XXRCDSJ6B9GpCKcWGMHHQeI5FJG662Nj7MSTfNLu9JkLPTpCL3IQ.','GIAO_VIEN',1,NULL,'2026-05-25 00:12:28','2026-05-25 00:12:28'),(3,'hocsinh1','$2a$10$tWjZE6arfW3c/93cMu7NlOaM6uaOFUoCYEk6j54Zazylw1T0W1eaS','HOC_SINH',1,NULL,'2026-05-25 00:12:28','2026-05-25 00:12:28'),(4,'phuhuynh1','$2a$10$J0Y3nLrLoFXhkI31DOV1uOKxVmI/fLqXhjBrS/W9RK2RBcAZyJSG6','PHU_HUYNH',1,NULL,'2026-05-25 00:12:29','2026-05-25 00:12:29');

DROP TABLE IF EXISTS `van_ban`;
CREATE TABLE `van_ban` (
  `id_vanban` int NOT NULL AUTO_INCREMENT,
  `loai_van_ban` varchar(50) DEFAULT NULL,
  `ngay_ban_hanh` date DEFAULT NULL,
  `so_hieu` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id_vanban`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

DROP TABLE IF EXISTS `vi_pham`;
CREATE TABLE `vi_pham` (
  `id_vipham` int NOT NULL AUTO_INCREMENT,
  `muc_do` enum('NHE','TRUNG_BINH','NGHIEM_TRONG') DEFAULT NULL,
  `ngay_vi_pham` date DEFAULT NULL,
  `noi_dung` varchar(255) DEFAULT NULL,
  `id_hocsinh` int NOT NULL,
  PRIMARY KEY (`id_vipham`),
  KEY `FKmao67w1i2i77aonwfp7nv2uj0` (`id_hocsinh`),
  CONSTRAINT `FKmao67w1i2i77aonwfp7nv2uj0` FOREIGN KEY (`id_hocsinh`) REFERENCES `hoc_sinh` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;