-- MySQL dump 10.13  Distrib 8.0.42, for Linux (x86_64)
--
-- Host: localhost    Database: node_api
-- ------------------------------------------------------
-- Server version	8.0.42-0ubuntu0.22.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `dairy`
--

DROP TABLE IF EXISTS `dairy`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dairy` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `branchname` varchar(100) DEFAULT NULL,
  `ownername` varchar(100) DEFAULT NULL,
  `days` int DEFAULT NULL,
  `villagename` varchar(100) DEFAULT NULL,
  `address` text,
  `password` varchar(255) NOT NULL,
  `createdby` varchar(100) DEFAULT NULL,
  `updatedby` varchar(100) DEFAULT NULL,
  `active` tinyint(1) DEFAULT '1',
  `expire` tinyint(1) DEFAULT '0',
  `created_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `id` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dairy`
--

LOCK TABLES `dairy` WRITE;
/*!40000 ALTER TABLE `dairy` DISABLE KEYS */;
/*!40000 ALTER TABLE `dairy` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `organizations`
--

DROP TABLE IF EXISTS `organizations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `organizations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `org_name` varchar(255) NOT NULL,
  `org_details` text,
  `address` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `organizations`
--

LOCK TABLES `organizations` WRITE;
/*!40000 ALTER TABLE `organizations` DISABLE KEYS */;
INSERT INTO `organizations` VALUES (1,'dairy1','dairy1 description',''),(2,'dairy2','dairy2 description','Shivaji Chawk narayangaon junnar, pune');
/*!40000 ALTER TABLE `organizations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp`
--

DROP TABLE IF EXISTS `otp`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp` (
  `id` int NOT NULL AUTO_INCREMENT,
  `mobile_number` varchar(15) NOT NULL,
  `otp` varchar(6) DEFAULT NULL,
  `otp_expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `mobile_number` (`mobile_number`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp`
--

LOCK TABLES `otp` WRITE;
/*!40000 ALTER TABLE `otp` DISABLE KEYS */;
INSERT INTO `otp` VALUES (1,'9970977990','927490','2025-06-04 19:46:07','2025-05-25 10:47:59'),(14,'9999999999','382838','2025-05-25 13:19:54','2025-05-25 12:25:44'),(15,'9921414144','603730','2025-05-25 12:40:48','2025-05-25 12:30:47'),(23,'2222222222','733763','2025-05-25 12:55:11','2025-05-25 12:45:11'),(26,'4444444442','276443','2025-05-25 12:55:37','2025-05-25 12:45:37'),(27,'9921314151','997078','2025-05-25 13:07:04','2025-05-25 12:51:17'),(31,'9988776655','386136','2025-05-25 14:51:01','2025-05-25 13:13:39'),(32,'9999997876','392781','2025-05-25 13:29:18','2025-05-25 13:19:18'),(36,'9879879871','775939','2025-05-25 14:44:17','2025-05-25 14:34:17'),(41,'8097788997','463350','2025-06-04 19:46:26','2025-06-04 19:36:26');
/*!40000 ALTER TABLE `otp` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `role_name` varchar(255) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'farmer');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `organization` varchar(255) NOT NULL,
  `role` varchar(255) NOT NULL,
  `confirm` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'testuser','$2b$10$pYNryyglL4nq50ZM0QCX9.S.qUlwhNdKhk.qTyoxjM6BsC16oFdfC','9970977990','dairy1','farmer',1),(2,'harshad','$2b$10$yrG/06oXj1YM7PRV9vzsVOc0LG2yepVr54nbWFPcVY7piZVwP6Bsy','9988776655','dairy1','farmer',1);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-06-12  0:49:39
-- Table structure for table `web_users`
-- For Creating new users in web_users table
-- by Brahmjot Singh
-- 17-11-2025 18:30:00

DROP TABLE IF EXISTS `web_users`;
CREATE TABLE web_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  temp_pw VARCHAR(10) NOT NULL,
  password VARCHAR(255) DEFAULT NULL,
  mobile_number VARCHAR(20) NOT NULL,
  branches JSON DEFAULT NULL
);

DROP TABLE IF EXISTS `vlc_collection_entry`;
CREATE TABLE vlc_collection_entry (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATETIME NOT NULL,
  shift VARCHAR(20) NOT NULL,
  vlc_id VARCHAR(50) NOT NULL,
  vlc_name VARCHAR(100) NOT NULL,
  weight DECIMAL(10,2) NOT NULL,
  fat DECIMAL(5,2) NOT NULL,
  snf DECIMAL(5,2) NOT NULL,
  clr DECIMAL(5,2) NOT NULL,
  rate DECIMAL(10,2) NOT NULL,
  amount DECIMAL(10,2) NOT NULL
);

DROP TABLE IF EXISTS `dispatch_entry`;
CREATE TABLE dispatch_entry (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATETIME NOT NULL,
  weight DECIMAL(10,2) NOT NULL,
  avg_fat DECIMAL(5,2) NOT NULL,
  avg_snf DECIMAL(5,2) NOT NULL,
  rate_per_liter DECIMAL(10,2) NOT NULL,
  commission_amount_per_liter DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL
);

DROP TABLE IF EXISTS `vlc_commission_entry`;
CREATE TABLE vlc_commission_entry (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vlcc VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  effective_from DATE NOT NULL
);

DROP TABLE IF EXISTS `vlc_ts_entry`;
CREATE TABLE vlc_ts_entry (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vlc VARCHAR(100) NOT NULL,
  kg_fat_rate DECIMAL(10,2) NOT NULL,
  kg_snf_rate DECIMAL(10,2) NOT NULL,
  effective_from DATE NOT NULL
);

DROP TABLE IF EXISTS `settings`;
CREATE TABLE settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  vlc VARCHAR(100) NOT NULL UNIQUE,
  add_farmer TINYINT(1) DEFAULT 0,
  rate_chart TINYINT(1) DEFAULT 0,
  deduction TINYINT(1) DEFAULT 0,
  payment_receipt TINYINT(1) DEFAULT 0,
  generate_bill TINYINT(1) DEFAULT 0,
  analyser TINYINT(1) DEFAULT 0,
  weight_tier TINYINT(1) DEFAULT 0,
  weight TINYINT(1) DEFAULT 0,
  printer TINYINT(1) DEFAULT 0,
  language VARCHAR(50) DEFAULT 'English',
  report_language VARCHAR(50) DEFAULT 'English'
);
