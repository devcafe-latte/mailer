-- Adminer 4.7.1 MySQL dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

  USE `mailer`;

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
  `transportId` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `transportId` (`transportId`),
  CONSTRAINT `email_ibfk_1` FOREIGN KEY (`transportId`) REFERENCES `transport` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `mailgunSettings`;
CREATE TABLE `mailgunSettings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `apiKey` varchar(255) NOT NULL,
  `domain` varchar(255) NOT NULL,
  `host` varchar(255) NOT NULL,
  `transportId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `transportId` (`transportId`),
  CONSTRAINT `mailgunSettings_ibfk_1` FOREIGN KEY (`transportId`) REFERENCES `transport` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `migrations`;
CREATE TABLE `migrations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `run_on` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;

INSERT INTO `migrations` (`id`, `name`, `run_on`) VALUES
(1,	'/20201122015904-template',	'2020-11-22 09:30:36'),
(2,	'/20210113040146-transports',	'2021-01-14 10:10:25')
ON DUPLICATE KEY UPDATE `id` = VALUES(`id`), `name` = VALUES(`name`), `run_on` = VALUES(`run_on`);

DROP TABLE IF EXISTS `sendInBlueSettings`;
CREATE TABLE `sendInBlueSettings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `apiKey` varchar(255) NOT NULL,
  `apiUrl` varchar(255) NOT NULL,
  `transportId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `transportId` (`transportId`),
  CONSTRAINT `sendInBlueSettings_ibfk_1` FOREIGN KEY (`transportId`) REFERENCES `transport` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `smtpSettings`;
CREATE TABLE `smtpSettings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `server` varchar(255) NOT NULL,
  `port` int(11) NOT NULL,
  `user` varchar(255) NOT NULL,
  `pass` varchar(255) NOT NULL,
  `secure` tinyint(4) NOT NULL,
  `transportId` int(11) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `transportId` (`transportId`),
  CONSTRAINT `smtpSettings_ibfk_1` FOREIGN KEY (`transportId`) REFERENCES `transport` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `template`;
CREATE TABLE `template` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `language` varchar(5) COLLATE utf8mb4_general_ci NOT NULL,
  `subject` text COLLATE utf8mb4_general_ci NOT NULL,
  `text` text COLLATE utf8mb4_general_ci NOT NULL,
  `html` text COLLATE utf8mb4_general_ci,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `transport`;
CREATE TABLE `transport` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `type` varchar(100) NOT NULL,
  `active` tinyint(4) NOT NULL,
  `weight` int(11) DEFAULT NULL,
  `default` tinyint(4) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDBDEFAULT CHARSET=utf8;


-- 2021-01-22 08:55:07