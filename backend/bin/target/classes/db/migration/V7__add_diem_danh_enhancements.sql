-- Them cot tiet_hoc, mon_hoc_id, loai_vang cho bang diem_danh
-- Cap nhat unique constraint de ho tro diem danh theo tiet

-- Xoa unique constraint cu
ALTER TABLE `diem_danh` DROP INDEX `uk_diemdanh`;

-- Them cot moi
ALTER TABLE `diem_danh`
  ADD COLUMN `tiet_hoc` INT NULL AFTER `hoc_sinh_id`,
  ADD COLUMN `mon_hoc_id` INT NULL AFTER `tiet_hoc`,
  ADD COLUMN `loai_vang` VARCHAR(20) NULL DEFAULT 'CO_MAT' AFTER `mon_hoc_id`;

-- Cap nhat loai_vang tu du lieu co_phep/khong_phep cu
UPDATE `diem_danh` SET `loai_vang` = 'CO_PHEP' WHERE `co_phep` = 1;
UPDATE `diem_danh` SET `loai_vang` = 'KHONG_PHEP' WHERE `khong_phep` = 1;
UPDATE `diem_danh` SET `loai_vang` = 'CO_MAT' WHERE `loai_vang` IS NULL;

-- Them unique constraint moi (bao gom tiet_hoc)
ALTER TABLE `diem_danh`
  ADD UNIQUE KEY `uk_diemdanh_tiet` (`ngay`, `lop_hoc_id`, `hoc_sinh_id`, `tiet_hoc`);
