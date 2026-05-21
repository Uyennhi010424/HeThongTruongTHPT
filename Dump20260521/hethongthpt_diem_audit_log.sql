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
-- Table structure for table `diem_audit_log`
--

DROP TABLE IF EXISTS `diem_audit_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diem_audit_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `diem_id` int NOT NULL,
  `hoc_sinh_id` int NOT NULL,
  `mon_hoc_id` int NOT NULL,
  `gia_tri_cu` decimal(4,1) DEFAULT NULL,
  `gia_tri_moi` decimal(4,1) DEFAULT NULL,
  `hanh_dong` enum('INSERT','UPDATE','DELETE') NOT NULL,
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diem_audit_log`
--

LOCK TABLES `diem_audit_log` WRITE;
/*!40000 ALTER TABLE `diem_audit_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `diem_audit_log` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-05-21 14:58:25
