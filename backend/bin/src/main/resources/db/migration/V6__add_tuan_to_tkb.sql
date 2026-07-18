-- V6: Add tuan (week number) column to thoi_khoa_bieu table
-- This allows different timetable schedules per week

ALTER TABLE `thoi_khoa_bieu`
  ADD COLUMN `tuan` INT NOT NULL DEFAULT 1
  AFTER `nam_hoc`;

CREATE INDEX `idx_tkb_tuan` ON `thoi_khoa_bieu`(`tuan`);
