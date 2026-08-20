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
-- Table structure for table `phan_cong_day`
--

DROP TABLE IF EXISTS `phan_cong_day`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phan_cong_day` (
  `id` int NOT NULL AUTO_INCREMENT,
  `giao_vien_id` int NOT NULL,
  `mon_hoc_id` int NOT NULL,
  `lop_id` int NOT NULL,
  `hoc_ky` int NOT NULL,
  `nam_hoc` varchar(9) NOT NULL,
  `ngay_bat_dau` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pcd` (`giao_vien_id`,`mon_hoc_id`,`lop_id`,`hoc_ky`),
  KEY `fk_pcd_mon` (`mon_hoc_id`),
  KEY `idx_pcd_namhoc_hk` (`nam_hoc`,`hoc_ky`),
  KEY `idx_pcd_lop` (`lop_id`),
  CONSTRAINT `fk_pcd_gv` FOREIGN KEY (`giao_vien_id`) REFERENCES `giao_vien` (`id`),
  CONSTRAINT `fk_pcd_lop` FOREIGN KEY (`lop_id`) REFERENCES `lop` (`id`),
  CONSTRAINT `fk_pcd_mon` FOREIGN KEY (`mon_hoc_id`) REFERENCES `mon_hoc` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phan_cong_day`
--

LOCK TABLES `phan_cong_day` WRITE;
/*!40000 ALTER TABLE `phan_cong_day` DISABLE KEYS */;
/*!40000 ALTER TABLE `phan_cong_day` ENABLE KEYS */;
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
