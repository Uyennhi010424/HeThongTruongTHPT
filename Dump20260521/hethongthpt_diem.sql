-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: localhost    Database: hethongthpt
-- ------------------------------------------------------
-- Server version	8.0.44

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `diem`
--

DROP TABLE IF EXISTS `diem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diem` (
  `id` int NOT NULL AUTO_INCREMENT,
  `hoc_sinh_id` int NOT NULL,
  `mon_hoc_id` int NOT NULL,
  `phan_cong_day_id` int NOT NULL,
  `loai_diem` enum('TX','GK','CK') NOT NULL,
  `so_thu_tu` int NOT NULL DEFAULT '0' COMMENT 'TX1/TX2/TX3/TX4; dùng 0 cho GK và CK',
  `hoc_ky` int NOT NULL,
  `nam_hoc` varchar(9) NOT NULL,
  `gia_tri` decimal(4,1) DEFAULT NULL,
  `nhan_xet` enum('DAT','CHUA_DAT') DEFAULT NULL,
  `status` enum('DRAFT','CONFIRMED','LOCKED') NOT NULL DEFAULT 'DRAFT',
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diem`
--

LOCK TABLES `diem` WRITE;
/*!40000 ALTER TABLE `diem` DISABLE KEYS */;
/*!40000 ALTER TABLE `diem` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-21 14:58:27
