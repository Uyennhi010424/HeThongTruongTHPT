-- =====================================================
-- THÊM MÔN HỌC: GDĐP, HĐTN (nếu chưa có)
-- =====================================================
INSERT IGNORE INTO `mon_hoc` (`ten_mon`, `ma_mon`, `nhom_danh_gia`, `so_dtx_hoc_ky`, `khoi_ap_dung`, `is_active`) VALUES
('Nội dung giáo dục địa phương', 'GDDP', 'NHAN_XET', 0, '10,11,12', 1),
('Hoạt động trải nghiệm, hướng nghiệp', 'HDTN', 'NHAN_XET', 0, '10,11,12', 1);

-- =====================================================
-- THÊM TÀI KHOẢN USER CHO GIÁO VIÊN MỚI
-- =====================================================
-- Mật khẩu mặc định: Abc1234@
INSERT IGNORE INTO `users` (`username`, `password`, `role`, `is_active`, `must_change_password`) VALUES
-- Giáo viên Âm nhạc
('gv0082', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOXkQ7t4HhGcHGOlRe8JKcfkDIFHqJKaO', 'GIAO_VIEN', 1, 0),
('gv0083', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOXkQ7t4HhGcHGOlRe8JKcfkDIFHqJKaO', 'GIAO_VIEN', 1, 0),
('gv0084', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOXkQ7t4HhGcHGOlRe8JKcfkDIFHqJKaO', 'GIAO_VIEN', 1, 0),
-- Giáo viên GDĐP
('gv0085', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOXkQ7t4HhGcHGOlRe8JKcfkDIFHqJKaO', 'GIAO_VIEN', 1, 0),
('gv0086', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOXkQ7t4HhGcHGOlRe8JKcfkDIFHqJKaO', 'GIAO_VIEN', 1, 0),
('gv0087', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOXkQ7t4HhGcHGOlRe8JKcfkDIFHqJKaO', 'GIAO_VIEN', 1, 0),
-- Giáo viên HĐTN
('gv0088', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOXkQ7t4HhGcHGOlRe8JKcfkDIFHqJKaO', 'GIAO_VIEN', 1, 0),
('gv0089', '$2a$10$8K1p/a0dL1LXMIgoEDFrwOXkQ7t4HhGcHGOlRe8JKcfkDIFHqJKaO', 'GIAO_VIEN', 1, 0);

-- =====================================================
-- THÊM HỒ SƠ GIÁO VIÊN
-- =====================================================
-- Lấy user_id vừa tạo
-- Giáo viên Âm nhạc (3 người)
INSERT IGNORE INTO `giao_vien` (`user_id`, `ma_giao_vien`, `ho_ten`, `email`, `so_dien_thoai`, `bo_mon`, `trinh_do`, `gioi_tinh`, `ngay_sinh`, `dia_chi`) VALUES
((SELECT id FROM `users` WHERE username = 'gv0082'), 'GV0082', 'Nguyễn Thị Hoa', 'hoa.nt@tdn.edu.vn', '0901234567', 'Âm nhạc', 'Cử nhân', 0, '1990-03-15', 'TP. Đà Nẵng'),
((SELECT id FROM `users` WHERE username = 'gv0083'), 'GV0083', 'Trần Thị Mai', 'mai.tt@tdn.edu.vn', '0901234568', 'Âm nhạc', 'Cử nhân', 0, '1992-07-22', 'TP. Đà Nẵng'),
((SELECT id FROM `users` WHERE username = 'gv0084'), 'GV0084', 'Lê Thị Ngọc', 'ngoc.lt@tdn.edu.vn', '0901234569', 'Âm nhạc', 'Thạc sĩ', 0, '1988-11-05', 'TP. Đà Nẵng');

-- Giáo viên GDĐP (3 người)
INSERT IGNORE INTO `giao_vien` (`user_id`, `ma_giao_vien`, `ho_ten`, `email`, `so_dien_thoai`, `bo_mon`, `trinh_do`, `gioi_tinh`, `ngay_sinh`, `dia_chi`) VALUES
((SELECT id FROM `users` WHERE username = 'gv0085'), 'GV0085', 'Phạm Văn Hùng', 'hung.pv@tdn.edu.vn', '0901234570', 'Giáo dục địa phương', 'Cử nhân', 1, '1991-01-10', 'TP. Đà Nẵng'),
((SELECT id FROM `users` WHERE username = 'gv0086'), 'GV0086', 'Hoàng Thị Lan', 'lan.ht@tdn.edu.vn', '0901234571', 'Giáo dục địa phương', 'Cử nhân', 0, '1993-05-18', 'TP. Đà Nẵng'),
((SELECT id FROM `users` WHERE username = 'gv0087'), 'GV0087', 'Đỗ Văn Khánh', 'khanh.dv@tdn.edu.vn', '0901234572', 'Giáo dục địa phương', 'Thạc sĩ', 1, '1989-09-30', 'TP. Đà Nẵng');

-- Giáo viên HĐTN (2 người)
INSERT IGNORE INTO `giao_vien` (`user_id`, `ma_giao_vien`, `ho_ten`, `email`, `so_dien_thoai`, `bo_mon`, `trinh_do`, `gioi_tinh`, `ngay_sinh`, `dia_chi`) VALUES
((SELECT id FROM `users` WHERE username = 'gv0088'), 'GV0088', 'Vũ Thị Phương', 'phuong.vt@tdn.edu.vn', '0901234573', 'Hoạt động trải nghiệm', 'Cử nhân', 0, '1994-04-12', 'TP. Đà Nẵng'),
((SELECT id FROM `users` WHERE username = 'gv0089'), 'GV0089', 'Bùi Văn Đức', 'duc.bv@tdn.edu.vn', '0901234574', 'Hoạt động trải nghiệm', 'Cử nhân', 1, '1990-12-08', 'TP. Đà Nẵng');
