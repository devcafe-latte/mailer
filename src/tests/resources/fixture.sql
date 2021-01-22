-- Adminer 4.7.1 MySQL dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

DROP DATABASE IF EXISTS `mailer_test`;
CREATE DATABASE `mailer_test` /*!40100 DEFAULT CHARACTER SET utf8 */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `mailer_test`;

SET NAMES utf8mb4;

DROP TABLE IF EXISTS `email`;
CREATE TABLE `email` (
  `id` int NOT NULL AUTO_INCREMENT,
  `from` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `to` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `replyTo` varchar(255) CHARACTER SET utf8 COLLATE utf8_general_ci DEFAULT NULL,
  `subject` varchar(511) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `html` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `maxRetries` int NOT NULL,
  `attempt` int NOT NULL,
  `status` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `error` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  `sent` int DEFAULT NULL,
  `created` int NOT NULL,
  `retryAfter` int DEFAULT NULL,
  `template` varchar(150) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `language` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci DEFAULT NULL,
  `transportId` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transportId` (`transportId`),
  CONSTRAINT `email_ibfk_1` FOREIGN KEY (`transportId`) REFERENCES `transport` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;


DROP TABLE IF EXISTS `mailgunSettings`;
CREATE TABLE `mailgunSettings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `apiKey` varchar(255) NOT NULL,
  `domain` varchar(255) NOT NULL,
  `host` varchar(255) NOT NULL,
  `transportId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `transportId` (`transportId`),
  CONSTRAINT `mailgunSettings_ibfk_1` FOREIGN KEY (`transportId`) REFERENCES `transport` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `run_on` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `migrations` (`id`, `name`, `run_on`) VALUES
(1,	'/20201122015904-template',	'2020-11-22 09:30:36'),
(2,	'/20210113040146-transports',	'2021-01-14 10:10:25');

DROP TABLE IF EXISTS `sendInBlueSettings`;
CREATE TABLE `sendInBlueSettings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `apiKey` varchar(255) NOT NULL,
  `apiUrl` varchar(255) NOT NULL,
  `transportId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `transportId` (`transportId`),
  CONSTRAINT `sendInBlueSettings_ibfk_1` FOREIGN KEY (`transportId`) REFERENCES `transport` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `smtpSettings`;
CREATE TABLE `smtpSettings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `server` varchar(255) NOT NULL,
  `port` int NOT NULL,
  `user` varchar(255) NOT NULL,
  `pass` varchar(255) NOT NULL,
  `secure` tinyint NOT NULL,
  `transportId` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `transportId` (`transportId`),
  CONSTRAINT `smtpSettings_ibfk_1` FOREIGN KEY (`transportId`) REFERENCES `transport` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;


DROP TABLE IF EXISTS `template`;
CREATE TABLE `template` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `language` varchar(5) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `subject` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `text` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `html` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `template` (`id`, `name`, `language`, `subject`, `text`, `html`) VALUES
(1,	'test-template-1',	'en',	'I live in a giant {{ foo }}.',	'Text {{ foo }}.\r\nText {{ bar }}.\r\nText {{ baz }}.',	'<p>\r\nhtml {{ foo }}.\r\nhtml {{ bar }}.\r\nhtml {{ baz }}.\r\n</p>'),
(2,	'test-template-1',	'de',	'Ich lebe in einem riesigen {{ foo }}.',	'Text {{ foo }}.\r\nText {{ bar }}.\r\nText {{ baz }}.',	'<p>\r\nhtml {{ foo }}.\r\nhtml {{ bar }}.\r\nhtml {{ baz }}.\r\n</p>'),
(3,	'test-template-2',	'en',	'{{x}} and {{y}}',	'Some text but no HTML',	NULL);

DROP TABLE IF EXISTS `transport`;
CREATE TABLE `transport` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` varchar(100) NOT NULL,
  `active` tinyint NOT NULL,
  `weight` int DEFAULT NULL,
  `default` tinyint NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

INSERT INTO `transport` (`id`, `name`, `type`, `active`, `weight`, `default`) VALUES
(1,	'Transport 1',	'mock',	1,	5,	0),
(2,	'Transport 2',	'mock',	1,	30,	0),
(3,	'Transport 3',	'mock',	1,	15,	1),
(4,	'Transport disabled',	'mock',	0,	50,	0);

-- 2021-01-14 03:12:08