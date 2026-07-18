-- =============================================================
-- V13: TẠO ĐIỂM + HÀNH KIỂM + HỌC BẠ
-- Dùng dữ liệu CÓ SẴN: 30 lớp, 78 GV, học sinh đã tồn tại
-- Năm học: 2025-2026, NamHoc id = 3
-- =============================================================

-- =============================================================
-- 0. ĐẢM BẢO CỘT HOC_KY TRONG HANH_KIEM
-- =============================================================
SET @col_exists = (
    SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'hanh_kiem' AND column_name = 'hoc_ky'
);
SET @sql = IF(@col_exists = 0,
    'ALTER TABLE `hanh_kiem` ADD COLUMN `hoc_ky` INT DEFAULT NULL AFTER `id_namhoc`',
    'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================================
-- 1. PHÂN CÔNG DẠY (phan_cong_day)
-- Dùng procedure: tự lấy danh sách lớp + GV theo bộ môn
-- 30 lớp × 8 môn × 2 HK = 480 records
-- =============================================================

DELIMITER //

CREATE PROCEDURE IF NOT EXISTS `seed_phan_cong_day`()
BEGIN
    DECLARE v_lop_id INT;
    DECLARE v_mon INT;
    DECLARE v_hk INT;
    DECLARE v_gv_id INT;
    DECLARE v_lop_done INT DEFAULT 0;
    DECLARE v_gv_toan CURSOR FOR SELECT id FROM giao_vien WHERE bo_mon = 'Toán' ORDER BY id;
    DECLARE v_gv_van CURSOR FOR SELECT id FROM giao_vien WHERE bo_mon = 'Ngữ văn' ORDER BY id;
    DECLARE v_gv_anh CURSOR FOR SELECT id FROM giao_vien WHERE bo_mon = 'Tiếng Anh' ORDER BY id;
    DECLARE v_gv_ly CURSOR FOR SELECT id FROM giao_vien WHERE bo_mon = 'Vật lí' ORDER BY id;
    DECLARE v_gv_hoa CURSOR FOR SELECT id FROM giao_vien WHERE bo_mon = 'Hóa học' ORDER BY id;
    DECLARE v_gv_sinh CURSOR FOR SELECT id FROM giao_vien WHERE bo_mon = 'Sinh học' ORDER BY id;
    DECLARE v_gv_su CURSOR FOR SELECT id FROM giao_vien WHERE bo_mon = 'Lịch sử' ORDER BY id;
    DECLARE v_gv_dia CURSOR FOR SELECT id FROM giao_vien WHERE bo_mon = 'Địa lí' ORDER BY id;

    -- Bảng tạm lưu GV theo môn
    DROP TEMPORARY TABLE IF EXISTS tmp_gv_mon;
    CREATE TEMPORARY TABLE tmp_gv_mon (
        mon_id INT, gv_id INT, gv_idx INT, PRIMARY KEY(mon_id, gv_idx)
    );

    -- Đổ GV Toán
    SET @idx = 0;
    INSERT INTO tmp_gv_mon SELECT 1, id, (@idx := @idx + 1) FROM giao_vien WHERE bo_mon = 'Toán' ORDER BY id;
    -- Đổ GV Văn
    SET @idx = 0;
    INSERT INTO tmp_gv_mon SELECT 2, id, (@idx := @idx + 1) FROM giao_vien WHERE bo_mon = 'Ngữ văn' ORDER BY id;
    -- Đổ GV Anh
    SET @idx = 0;
    INSERT INTO tmp_gv_mon SELECT 3, id, (@idx := @idx + 1) FROM giao_vien WHERE bo_mon = 'Tiếng Anh' ORDER BY id;
    -- Đổ GV Lý
    SET @idx = 0;
    INSERT INTO tmp_gv_mon SELECT 4, id, (@idx := @idx + 1) FROM giao_vien WHERE bo_mon = 'Vật lí' ORDER BY id;
    -- Đổ GV Hóa
    SET @idx = 0;
    INSERT INTO tmp_gv_mon SELECT 5, id, (@idx := @idx + 1) FROM giao_vien WHERE bo_mon = 'Hóa học' ORDER BY id;
    -- Đổ GV Sinh
    SET @idx = 0;
    INSERT INTO tmp_gv_mon SELECT 6, id, (@idx := @idx + 1) FROM giao_vien WHERE bo_mon = 'Sinh học' ORDER BY id;
    -- Đổ GV Sử
    SET @idx = 0;
    INSERT INTO tmp_gv_mon SELECT 7, id, (@idx := @idx + 1) FROM giao_vien WHERE bo_mon = 'Lịch sử' ORDER BY id;
    -- Đổ GV Địa
    SET @idx = 0;
    INSERT INTO tmp_gv_mon SELECT 8, id, (@idx := @idx + 1) FROM giao_vien WHERE bo_mon = 'Địa lí' ORDER BY id;

    -- Duyệt từng lớp
    BEGIN
        DECLARE cur_lop CURSOR FOR SELECT id FROM lop ORDER BY id;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_lop_done = 1;
        OPEN cur_lop;

        lop_loop: LOOP
            FETCH cur_lop INTO v_lop_id;
            IF v_lop_done = 1 THEN LEAVE lop_loop; END IF;

            SET @lop_row = 0;
            SET @lop_row = (SELECT COUNT(*) FROM lop WHERE id < v_lop_id) + 1;

            SET v_mon = 1;
            WHILE v_mon <= 8 DO
                -- Lấy GV cho môn này, xoay vòng theo lớp
                SET @gv_cnt = (SELECT COUNT(*) FROM tmp_gv_mon WHERE mon_id = v_mon);
                IF @gv_cnt > 0 THEN
                    SET @gv_pick = ((@lop_row - 1) MOD @gv_cnt) + 1;
                    SELECT gv_id INTO v_gv_id FROM tmp_gv_mon WHERE mon_id = v_mon AND gv_idx = @gv_pick;

                    SET v_hk = 1;
                    WHILE v_hk <= 2 DO
                        INSERT IGNORE INTO `phan_cong_day` (`giao_vien_id`, `mon_hoc_id`, `lop_id`, `hoc_ky`, `nam_hoc`)
                        VALUES (v_gv_id, v_mon, v_lop_id, v_hk, '2025-2026');
                        SET v_hk = v_hk + 1;
                    END WHILE;
                END IF;

                SET v_mon = v_mon + 1;
            END WHILE;
        END LOOP;

        CLOSE cur_lop;
    END;

    DROP TEMPORARY TABLE IF EXISTS tmp_gv_mon;
END //

DELIMITER ;

CALL seed_phan_cong_day();
DROP PROCEDURE IF EXISTS `seed_phan_cong_day`;


-- =============================================================
-- 2. ĐIỂM SỐ + HÀNH KIỂM + HỌC BẠ
-- Dùng procedure: duyệt tất cả HS, tự tạo điểm + HK + HB
-- =============================================================

DELIMITER //

-- Procedure tạo điểm cho 1 HS trong 1 HK
CREATE PROCEDURE IF NOT EXISTS `seed_diem_1hs_1hk`(
    IN p_hs_id INT,
    IN p_lop_id INT,
    IN p_hk INT,
    IN p_gvcn_id INT
)
BEGIN
    DECLARE v_mon INT DEFAULT 1;
    DECLARE v_pcd_id INT;
    DECLARE v_gv_mon INT;
    DECLARE v_base DECIMAL(3,1);
    DECLARE v_diem DECIMAL(3,1);

    WHILE v_mon <= 8 DO
        -- Tìm phan_cong_day_id
        SELECT id, giao_vien_id INTO v_pcd_id, v_gv_mon
        FROM phan_cong_day
        WHERE lop_id = p_lop_id AND mon_hoc_id = v_mon AND hoc_ky = p_hk AND nam_hoc = '2025-2026'
        LIMIT 1;

        IF v_pcd_id IS NOT NULL THEN
            SET v_base = 5.0 + ((p_hs_id * 7 + v_mon * 3 + p_hk * 11) MOD 50) / 10.0;

            -- Miệng
            SET v_diem = v_base + ((p_hs_id + v_mon) MOD 5) * 0.5 - 1.0;
            SET v_diem = GREATEST(3.0, LEAST(10.0, v_diem));
            INSERT IGNORE INTO `diem` (`hoc_sinh_id`,`mon_hoc_id`,`phan_cong_day_id`,`loai_diem`,`so_thu_tu`,`hoc_ky`,`nam_hoc`,`gia_tri`,`status`,`giao_vien_nhap_id`)
            VALUES (p_hs_id, v_mon, v_pcd_id, 'MIENG', 1, p_hk, '2025-2026', v_diem, 'CONFIRMED', v_gv_mon);

            -- 15 phút
            SET v_diem = v_base + ((p_hs_id * 3 + v_mon) MOD 4) * 0.5;
            SET v_diem = GREATEST(3.0, LEAST(10.0, v_diem));
            INSERT IGNORE INTO `diem` (`hoc_sinh_id`,`mon_hoc_id`,`phan_cong_day_id`,`loai_diem`,`so_thu_tu`,`hoc_ky`,`nam_hoc`,`gia_tri`,`status`,`giao_vien_nhap_id`)
            VALUES (p_hs_id, v_mon, v_pcd_id, 'MUOI_LAM_PHUT', 1, p_hk, '2025-2026', v_diem, 'CONFIRMED', v_gv_mon);

            -- 1 tiết
            SET v_diem = v_base + ((p_hs_id * 5 + v_mon * 2) MOD 6) * 0.5 - 0.5;
            SET v_diem = GREATEST(3.0, LEAST(10.0, v_diem));
            INSERT IGNORE INTO `diem` (`hoc_sinh_id`,`mon_hoc_id`,`phan_cong_day_id`,`loai_diem`,`so_thu_tu`,`hoc_ky`,`nam_hoc`,`gia_tri`,`status`,`giao_vien_nhap_id`)
            VALUES (p_hs_id, v_mon, v_pcd_id, 'MOT_TIET', 1, p_hk, '2025-2026', v_diem, 'CONFIRMED', v_gv_mon);

            -- Giữa kỳ
            SET v_diem = v_base + ((p_hs_id + v_mon * 4) MOD 3) * 0.5;
            SET v_diem = GREATEST(3.0, LEAST(10.0, v_diem));
            INSERT IGNORE INTO `diem` (`hoc_sinh_id`,`mon_hoc_id`,`phan_cong_day_id`,`loai_diem`,`so_thu_tu`,`hoc_ky`,`nam_hoc`,`gia_tri`,`status`,`giao_vien_nhap_id`)
            VALUES (p_hs_id, v_mon, v_pcd_id, 'GIUA_KY', 0, p_hk, '2025-2026', v_diem, 'CONFIRMED', v_gv_mon);

            -- Cuối kỳ
            SET v_diem = v_base + ((p_hs_id * 2 + v_mon) MOD 4) * 0.5 - 0.5;
            SET v_diem = GREATEST(3.0, LEAST(10.0, v_diem));
            INSERT IGNORE INTO `diem` (`hoc_sinh_id`,`mon_hoc_id`,`phan_cong_day_id`,`loai_diem`,`so_thu_tu`,`hoc_ky`,`nam_hoc`,`gia_tri`,`status`,`giao_vien_nhap_id`)
            VALUES (p_hs_id, v_mon, v_pcd_id, 'CUOI_KY', 0, p_hk, '2025-2026', v_diem, 'CONFIRMED', v_gv_mon);
        END IF;

        SET v_mon = v_mon + 1;
        SET v_pcd_id = NULL;
    END WHILE;
END //

-- Procedure chính: duyệt toàn bộ HS
CREATE PROCEDURE IF NOT EXISTS `seed_all_data`()
BEGIN
    DECLARE v_hs_id INT;
    DECLARE v_lop_id INT;
    DECLARE v_gvcn_id INT;
    DECLARE v_done INT DEFAULT 0;
    DECLARE cur CURSOR FOR
        SELECT hs.id, hs.lop_id, COALESCE(l.gvcn_id, (SELECT MIN(id) FROM giao_vien))
        FROM hoc_sinh hs
        LEFT JOIN lop l ON l.id = hs.lop_id
        ORDER BY hs.id;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    OPEN cur;

    hs_loop: LOOP
        FETCH cur INTO v_hs_id, v_lop_id, v_gvcn_id;
        IF v_done = 1 THEN LEAVE hs_loop; END IF;

        -- Điểm HK1 + HK2
        CALL seed_diem_1hs_1hk(v_hs_id, v_lop_id, 1, v_gvcn_id);
        CALL seed_diem_1hs_1hk(v_hs_id, v_lop_id, 2, v_gvcn_id);

        -- Hạnh kiểm HK1
        INSERT IGNORE INTO `hanh_kiem` (`id_hocsinh`,`id_giaovien`,`id_namhoc`,`hoc_ky`,`xep_loai`,`nhan_xet`,`ngay_danh_gia`)
        VALUES (v_hs_id, v_gvcn_id, 3, 1,
            CASE WHEN (v_hs_id * 7) MOD 10 < 5 THEN 'TOT' WHEN (v_hs_id * 7) MOD 10 < 8 THEN 'KHA' ELSE 'TRUNG_BINH' END,
            CASE WHEN (v_hs_id * 7) MOD 10 < 5 THEN 'Học sinh chăm ngoan, tích cực tham gia hoạt động.' WHEN (v_hs_id * 7) MOD 10 < 8 THEN 'Học sinh chăm chỉ, cần cố gắng thêm.' ELSE 'Học sinh cần nỗ lực hơn trong học tập và rèn luyện.' END,
            '2025-12-28');

        -- Hạnh kiểm HK2
        INSERT IGNORE INTO `hanh_kiem` (`id_hocsinh`,`id_giaovien`,`id_namhoc`,`hoc_ky`,`xep_loai`,`nhan_xet`,`ngay_danh_gia`)
        VALUES (v_hs_id, v_gvcn_id, 3, 2,
            CASE WHEN (v_hs_id * 11) MOD 10 < 5 THEN 'TOT' WHEN (v_hs_id * 11) MOD 10 < 8 THEN 'KHA' ELSE 'TRUNG_BINH' END,
            CASE WHEN (v_hs_id * 11) MOD 10 < 5 THEN 'Học sinh luôn hoàn thành tốt nhiệm vụ, gương mẫu.' WHEN (v_hs_id * 11) MOD 10 < 8 THEN 'Học sinh ngoan ngoãn, học khá, tham gia tốt.' ELSE 'Học sinh cần cố gắng hơn, chú ý đi học đầy đủ.' END,
            '2026-05-25');

        -- Học bạ
        INSERT IGNORE INTO `hoc_ba` (`id_hocba`,`id_hocsinh`,`id_namhoc`,`hoc_luc`,`hanh_kiem`,`ghi_chu`)
        VALUES (v_hs_id, v_hs_id, 3,
            CASE WHEN (v_hs_id * 13) MOD 10 < 3 THEN 'GIOI' WHEN (v_hs_id * 13) MOD 10 < 7 THEN 'KHA' ELSE 'TRUNG_BINH' END,
            CASE WHEN (v_hs_id * 7) MOD 10 < 5 THEN 'TOT' WHEN (v_hs_id * 7) MOD 10 < 8 THEN 'KHA' ELSE 'TRUNG_BINH' END,
            NULL);

    END LOOP;

    CLOSE cur;
END //

DELIMITER ;

-- Chạy
CALL seed_all_data();

-- Dọn dẹp
DROP PROCEDURE IF EXISTS `seed_diem_1hs_1hk`;
DROP PROCEDURE IF EXISTS `seed_all_data`;
