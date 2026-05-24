-- Add missing columns to hoc_sinh to persist Excel-imported fields
-- For MySQL versions that don't support ADD COLUMN IF NOT EXISTS, use conditional prepare
SET @schema := 'hethongthpt';
SET @table := 'hoc_sinh';

-- sdt
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@schema AND table_name=@table AND column_name='sdt')=0, 'ALTER TABLE hoc_sinh ADD COLUMN sdt VARCHAR(20) DEFAULT NULL', 'SELECT "col sdt exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- email
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@schema AND table_name=@table AND column_name='email')=0, 'ALTER TABLE hoc_sinh ADD COLUMN email VARCHAR(100) DEFAULT NULL', 'SELECT "col email exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- dan_toc
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@schema AND table_name=@table AND column_name='dan_toc')=0, 'ALTER TABLE hoc_sinh ADD COLUMN dan_toc VARCHAR(100) DEFAULT NULL', 'SELECT "col dan_toc exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ton_giao
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@schema AND table_name=@table AND column_name='ton_giao')=0, 'ALTER TABLE hoc_sinh ADD COLUMN ton_giao VARCHAR(100) DEFAULT NULL', 'SELECT "col ton_giao exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ma_bhyt
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@schema AND table_name=@table AND column_name='ma_bhyt')=0, 'ALTER TABLE hoc_sinh ADD COLUMN ma_bhyt VARCHAR(50) DEFAULT NULL', 'SELECT "col ma_bhyt exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- dien_chinh_sach
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@schema AND table_name=@table AND column_name='dien_chinh_sach')=0, 'ALTER TABLE hoc_sinh ADD COLUMN dien_chinh_sach TINYINT(1) DEFAULT 0', 'SELECT "col dien_chinh_sach exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- trang_thai
SET @sql := IF((SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=@schema AND table_name=@table AND column_name='trang_thai')=0, 'ALTER TABLE hoc_sinh ADD COLUMN trang_thai INT DEFAULT 1', 'SELECT "col trang_thai exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Ensure defaults for existing rows
UPDATE hoc_sinh SET dien_chinh_sach = 0 WHERE dien_chinh_sach IS NULL;
UPDATE hoc_sinh SET trang_thai = 1 WHERE trang_thai IS NULL;
