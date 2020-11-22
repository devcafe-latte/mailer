-- Adminer 4.7.1 MySQL dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `email`;
CREATE TABLE `email` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `to` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `replyTo` varchar(255) CHARACTER SET utf8 DEFAULT NULL,
  `subject` varchar(511) COLLATE utf8mb4_general_ci NOT NULL,
  `text` text COLLATE utf8mb4_general_ci,
  `html` text COLLATE utf8mb4_general_ci,
  `maxRetries` int(11) NOT NULL,
  `attempt` int(11) NOT NULL,
  `status` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `error` text COLLATE utf8mb4_general_ci,
  `sent` int(11) DEFAULT NULL,
  `created` int(11) NOT NULL,
  `retryAfter` int(11) DEFAULT NULL,
  `template` varchar(150) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `language` varchar(5) COLLATE utf8mb4_general_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `run_on` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `migrations` (`id`, `name`, `run_on`) VALUES
(1,	'/20201122015904-template',	'2020-11-22 09:30:36');

DROP TABLE IF EXISTS `template`;
CREATE TABLE `template` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `language` varchar(5) COLLATE utf8mb4_general_ci NOT NULL,
  `subject` text COLLATE utf8mb4_general_ci NOT NULL,
  `text` text COLLATE utf8mb4_general_ci NOT NULL,
  `html` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


-- 2020-11-22 02:59:04