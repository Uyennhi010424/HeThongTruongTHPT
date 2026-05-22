CREATE TABLE users (
  id INT NOT NULL AUTO_INCREMENT,
  username VARCHAR(50) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('ADMIN','GIAO_VIEN','HOC_SINH','PHU_HUYNH') NOT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  last_login DATETIME DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_username (username),
  KEY idx_users_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE giao_vien (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  ma_giao_vien VARCHAR(20) NOT NULL,
  ho_ten VARCHAR(100) NOT NULL,
  email VARCHAR(100) DEFAULT NULL,
  so_dien_thoai VARCHAR(15) DEFAULT NULL,
  ngay_sinh DATE DEFAULT NULL,
  dia_chi TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_gv_ma (ma_giao_vien),
  UNIQUE KEY uq_gv_email (email),
  KEY fk_gv_user (user_id),
  CONSTRAINT fk_gv_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE lop (
  id INT NOT NULL AUTO_INCREMENT,
  ten_lop VARCHAR(20) NOT NULL,
  khoi INT NOT NULL,
  nam_hoc VARCHAR(9) NOT NULL,
  gvcn_id INT DEFAULT NULL,
  si_so INT NOT NULL DEFAULT 0,
  phong_hoc VARCHAR(10) DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_lop_ten_namhoc (ten_lop, nam_hoc),
  KEY fk_lop_gvcn (gvcn_id),
  CONSTRAINT fk_lop_gvcn FOREIGN KEY (gvcn_id) REFERENCES giao_vien (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE hoc_sinh (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  ma_hoc_sinh VARCHAR(20) NOT NULL,
  ho_ten VARCHAR(100) NOT NULL,
  ngay_sinh DATE NOT NULL,
  gioi_tinh ENUM('NAM','NU') NOT NULL,
  lop_id INT DEFAULT NULL,
  dia_chi TEXT,
  nam_nhap_hoc YEAR NOT NULL,
  anh_dai_dien VARCHAR(255) DEFAULT NULL,
  fcm_token VARCHAR(500) DEFAULT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_hs_ma (ma_hoc_sinh),
  KEY fk_hs_user (user_id),
  KEY idx_hs_lop (lop_id),
  KEY idx_hs_nam_nhap (nam_nhap_hoc),
  CONSTRAINT fk_hs_lop FOREIGN KEY (lop_id) REFERENCES lop (id),
  CONSTRAINT fk_hs_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE phu_huynh (
  id INT NOT NULL AUTO_INCREMENT,
  user_id INT NOT NULL,
  ho_ten VARCHAR(100) NOT NULL,
  so_dien_thoai VARCHAR(15) NOT NULL,
  email VARCHAR(100) DEFAULT NULL,
  quan_he ENUM('CHA','ME','NGUOI_GIAM_HO') NOT NULL,
  is_sms_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  KEY fk_ph_user (user_id),
  CONSTRAINT fk_ph_user FOREIGN KEY (user_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE phu_huynh_hoc_sinh (
  id INT NOT NULL AUTO_INCREMENT,
  phu_huynh_id INT NOT NULL,
  hoc_sinh_id INT NOT NULL,
  quan_he ENUM('CHA','ME','NGUOI_GIAM_HO') NOT NULL,
  la_nguoi_lien_he_chinh TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_ph_hs (phu_huynh_id, hoc_sinh_id),
  KEY fk_phhs_hs (hoc_sinh_id),
  CONSTRAINT fk_phhs_hs FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh (id),
  CONSTRAINT fk_phhs_ph FOREIGN KEY (phu_huynh_id) REFERENCES phu_huynh (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE mon_hoc (
  id INT NOT NULL AUTO_INCREMENT,
  ten_mon VARCHAR(100) NOT NULL,
  ma_mon VARCHAR(20) NOT NULL,
  nhom_danh_gia ENUM('DIEM_SO','NHAN_XET') NOT NULL,
  so_dtx_hoc_ky INT NOT NULL,
  khoi_ap_dung VARCHAR(20) NOT NULL,
  mo_ta TEXT,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  UNIQUE KEY uq_mon_ten (ten_mon),
  UNIQUE KEY uq_mon_ma (ma_mon)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE nam_hoc (
  id INT NOT NULL AUTO_INCREMENT,
  ten_nam_hoc VARCHAR(9) NOT NULL,
  ngay_bat_dau_hk1 DATE NOT NULL,
  ngay_ket_thuc_hk1 DATE NOT NULL,
  ngay_bat_dau_hk2 DATE NOT NULL,
  ngay_ket_thuc_hk2 DATE NOT NULL,
  deadline_nhap_diem_hk1 DATE NOT NULL,
  deadline_nhap_diem_hk2 DATE NOT NULL,
  trang_thai ENUM('DANG_MO','DA_DONG') NOT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE thoi_khoa_bieu (
  id INT NOT NULL AUTO_INCREMENT,
  lop_id INT NOT NULL,
  mon_hoc_id INT NOT NULL,
  giao_vien_id INT NOT NULL,
  thu INT NOT NULL,
  tiet_bat_dau INT NOT NULL,
  so_tiet INT NOT NULL,
  phong_hoc VARCHAR(10) DEFAULT NULL,
  hoc_ky INT NOT NULL,
  nam_hoc VARCHAR(9) NOT NULL,
  PRIMARY KEY (id),
  KEY fk_tkb_mon (mon_hoc_id),
  KEY idx_tkb_lop_hk (lop_id, hoc_ky, nam_hoc),
  KEY idx_tkb_gv_hk (giao_vien_id, hoc_ky, nam_hoc),
  CONSTRAINT fk_tkb_gv FOREIGN KEY (giao_vien_id) REFERENCES giao_vien (id),
  CONSTRAINT fk_tkb_lop FOREIGN KEY (lop_id) REFERENCES lop (id),
  CONSTRAINT fk_tkb_mon FOREIGN KEY (mon_hoc_id) REFERENCES mon_hoc (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE lich_thi (
  id INT NOT NULL AUTO_INCREMENT,
  lop_id INT NOT NULL,
  mon_hoc_id INT NOT NULL,
  loai_kiem_tra ENUM('GK','CK','TX') NOT NULL,
  ngay_thi DATE NOT NULL,
  gio_bat_dau TIME NOT NULL,
  thoi_gian_lam_bai SMALLINT NOT NULL,
  phong_thi VARCHAR(20) DEFAULT NULL,
  ghi_chu TEXT,
  hoc_ky INT NOT NULL,
  nam_hoc VARCHAR(9) NOT NULL,
  PRIMARY KEY (id),
  KEY fk_lt_mon (mon_hoc_id),
  KEY idx_lt_lop_hk (lop_id, hoc_ky, nam_hoc),
  CONSTRAINT fk_lt_lop FOREIGN KEY (lop_id) REFERENCES lop (id),
  CONSTRAINT fk_lt_mon FOREIGN KEY (mon_hoc_id) REFERENCES mon_hoc (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE phan_cong_day (
  id INT NOT NULL AUTO_INCREMENT,
  giao_vien_id INT NOT NULL,
  mon_hoc_id INT NOT NULL,
  lop_id INT NOT NULL,
  hoc_ky INT NOT NULL,
  nam_hoc VARCHAR(9) NOT NULL,
  ngay_bat_dau DATE DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_pcd (giao_vien_id, mon_hoc_id, lop_id, hoc_ky),
  KEY fk_pcd_mon (mon_hoc_id),
  KEY idx_pcd_namhoc_hk (nam_hoc, hoc_ky),
  KEY idx_pcd_lop (lop_id),
  CONSTRAINT fk_pcd_gv FOREIGN KEY (giao_vien_id) REFERENCES giao_vien (id),
  CONSTRAINT fk_pcd_lop FOREIGN KEY (lop_id) REFERENCES lop (id),
  CONSTRAINT fk_pcd_mon FOREIGN KEY (mon_hoc_id) REFERENCES mon_hoc (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE diem (
  id INT NOT NULL AUTO_INCREMENT,
  hoc_sinh_id INT NOT NULL,
  mon_hoc_id INT NOT NULL,
  phan_cong_day_id INT NOT NULL,
  loai_diem ENUM('TX','GK','CK') NOT NULL,
  so_thu_tu INT NOT NULL DEFAULT 0,
  hoc_ky INT NOT NULL,
  nam_hoc VARCHAR(9) NOT NULL,
  gia_tri DECIMAL(4,1) DEFAULT NULL,
  nhan_xet ENUM('DAT','CHUA_DAT') DEFAULT NULL,
  status ENUM('DRAFT','CONFIRMED','LOCKED') NOT NULL DEFAULT 'DRAFT',
  ngay_nhap DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  giao_vien_nhap_id INT NOT NULL,
  ghi_chu TEXT,
  PRIMARY KEY (id),
  UNIQUE KEY uq_diem_hs (hoc_sinh_id, mon_hoc_id, loai_diem, so_thu_tu, hoc_ky, nam_hoc),
  KEY fk_diem_mon (mon_hoc_id),
  KEY fk_diem_gvn (giao_vien_nhap_id),
  KEY idx_diem_hs_mon (hoc_sinh_id, mon_hoc_id),
  KEY idx_diem_hk_namhoc (hoc_ky, nam_hoc),
  KEY idx_diem_status (status),
  KEY idx_diem_pcd (phan_cong_day_id),
  CONSTRAINT fk_diem_gvn FOREIGN KEY (giao_vien_nhap_id) REFERENCES giao_vien (id),
  CONSTRAINT fk_diem_hs FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh (id),
  CONSTRAINT fk_diem_mon FOREIGN KEY (mon_hoc_id) REFERENCES mon_hoc (id),
  CONSTRAINT fk_diem_pcd FOREIGN KEY (phan_cong_day_id) REFERENCES phan_cong_day (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE diem_audit_log (
  id INT NOT NULL AUTO_INCREMENT,
  diem_id INT NOT NULL,
  hoc_sinh_id INT NOT NULL,
  mon_hoc_id INT NOT NULL,
  gia_tri_cu DECIMAL(4,1) DEFAULT NULL,
  gia_tri_moi DECIMAL(4,1) DEFAULT NULL,
  hanh_dong ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  giao_vien_id INT NOT NULL,
  thoi_gian DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ly_do TEXT,
  ip_address VARCHAR(45) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fk_dal_diem (diem_id),
  KEY fk_dal_mon (mon_hoc_id),
  KEY fk_dal_gv (giao_vien_id),
  KEY idx_dal_hs_mon (hoc_sinh_id, mon_hoc_id),
  KEY idx_dal_thoi_gian (thoi_gian),
  CONSTRAINT fk_dal_diem FOREIGN KEY (diem_id) REFERENCES diem (id),
  CONSTRAINT fk_dal_gv FOREIGN KEY (giao_vien_id) REFERENCES giao_vien (id),
  CONSTRAINT fk_dal_hs FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh (id),
  CONSTRAINT fk_dal_mon FOREIGN KEY (mon_hoc_id) REFERENCES mon_hoc (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE thong_bao (
  id INT NOT NULL AUTO_INCREMENT,
  tieu_de VARCHAR(255) NOT NULL,
  noi_dung TEXT NOT NULL,
  loai ENUM('CHUNG','LOP','CA_NHAN') NOT NULL,
  lop_id INT DEFAULT NULL,
  hoc_sinh_id INT DEFAULT NULL,
  nguoi_tao_id INT NOT NULL,
  ngay_dang DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  han_hien_thi DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  KEY fk_tb_lop (lop_id),
  KEY fk_tb_hs (hoc_sinh_id),
  KEY fk_tb_nguoitao (nguoi_tao_id),
  CONSTRAINT fk_tb_hs FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh (id),
  CONSTRAINT fk_tb_lop FOREIGN KEY (lop_id) REFERENCES lop (id),
  CONSTRAINT fk_tb_nguoitao FOREIGN KEY (nguoi_tao_id) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE sms_log (
  id INT NOT NULL AUTO_INCREMENT,
  phu_huynh_id INT NOT NULL,
  hoc_sinh_id INT NOT NULL,
  so_dien_thoai VARCHAR(15) NOT NULL,
  noi_dung TEXT NOT NULL,
  trang_thai ENUM('PENDING','SENT','FAILED','RETRY') NOT NULL,
  so_lan_thu INT NOT NULL DEFAULT 0,
  thoi_gian_gui DATETIME DEFAULT NULL,
  ma_giao_dich VARCHAR(100) DEFAULT NULL,
  thang_nam VARCHAR(7) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY fk_sms_ph (phu_huynh_id),
  KEY idx_sms_trang_thai (trang_thai),
  KEY idx_sms_thang_nam (thang_nam),
  KEY idx_sms_hs (hoc_sinh_id),
  CONSTRAINT fk_sms_hs FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh (id),
  CONSTRAINT fk_sms_ph FOREIGN KEY (phu_huynh_id) REFERENCES phu_huynh (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE ai_suggestions (
  id INT NOT NULL AUTO_INCREMENT,
  hoc_sinh_id INT NOT NULL,
  noi_dung_json TEXT NOT NULL,
  hoc_ky INT NOT NULL,
  nam_hoc VARCHAR(9) NOT NULL,
  ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  het_han DATETIME NOT NULL,
  mo_hinh_ai VARCHAR(50) NOT NULL DEFAULT 'gemini-1.5-flash',
  PRIMARY KEY (id),
  KEY idx_ai_het_han (het_han),
  KEY idx_ai_hs_hk (hoc_sinh_id, hoc_ky, nam_hoc),
  CONSTRAINT fk_ai_hs FOREIGN KEY (hoc_sinh_id) REFERENCES hoc_sinh (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE admin_config (
  id INT NOT NULL AUTO_INCREMENT,
  config_key VARCHAR(100) NOT NULL,
  config_value TEXT NOT NULL,
  description VARCHAR(255) DEFAULT NULL,
  updated_by INT DEFAULT NULL,
  updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cfg_key (config_key),
  KEY fk_cfg_user (updated_by),
  CONSTRAINT fk_cfg_user FOREIGN KEY (updated_by) REFERENCES users (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;