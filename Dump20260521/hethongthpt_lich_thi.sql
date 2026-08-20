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
-- Table structure for table `lich_thi`
--

DROP TABLE IF EXISTS `lich_thi`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lich_thi` (
  `id` int NOT NULL AUTO_INCREMENT,
  `lop_id` int NOT NULL,
  `mon_hoc_id` int NOT NULL,
  `loai_kiem_tra` enum('GK','CK','TX') NOT NULL,
  `ngay_thi` date NOT NULL,
  `gio_bat_dau` time NOT NULL,
  `thoi_gian_lam_bai` smallint NOT NULL COMMENT 'Phút',
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lich_thi`
--

LOCK TABLES `lich_thi` WRITE;
/*!40000 ALTER TABLE `lich_thi` DISABLE KEYS */;
/*!40000 ALTER TABLE `lich_thi` ENABLE KEYS */;
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
