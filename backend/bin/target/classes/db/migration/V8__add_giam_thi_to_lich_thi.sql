-- Them cot giam_thi cho bang lich_thi
ALTER TABLE `lich_thi`
  ADD COLUMN `giam_thi_1_id` INT NULL AFTER `ghi_chu`,
  ADD COLUMN `giam_thi_2_id` INT NULL AFTER `giam_thi_1_id`;

ALTER TABLE `lich_thi`
  ADD CONSTRAINT `fk_lichthi_giamthi1` FOREIGN KEY (`giam_thi_1_id`) REFERENCES `giao_vien`(`id`),
  ADD CONSTRAINT `fk_lichthi_giamthi2` FOREIGN KEY (`giam_thi_2_id`) REFERENCES `giao_vien`(`id`);
