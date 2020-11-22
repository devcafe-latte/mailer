-- Adminer 4.7.1 MySQL dump

SET NAMES utf8;
SET time_zone = '+00:00';
SET foreign_key_checks = 0;
SET sql_mode = 'NO_AUTO_VALUE_ON_ZERO';

DROP DATABASE IF EXISTS `mailer_test`;
CREATE DATABASE `mailer_test` /*!40100 DEFAULT CHARACTER SET utf8 */;
USE `mailer_test`;

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

INSERT INTO `email` (`id`, `from`, `to`, `replyTo`, `subject`, `text`, `html`, `maxRetries`, `attempt`, `status`, `error`, `sent`, `created`, `retryAfter`, `template`, `language`) VALUES
(1,	'Ya Boi Testy McTestFace <noreply@cerem.co>',	'Coo van Leeuwen <c00yt825@gmail.com>',	NULL,	'I live in a giant {{ foo }}.',	'Text {{ foo }}.\r\nText {{ bar }}.\r\nText {{ baz }}.',	'<p>\r\nhtml {{ foo }}.\r\nhtml {{ bar }}.\r\nhtml {{ baz }}.\r\n</p>',	10,	0,	'sent',	NULL,	1606012238,	1606012236,	NULL,	'test-template-1',	'en');

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

INSERT INTO `template` (`id`, `name`, `language`, `subject`, `text`, `html`) VALUES
(1,	'test-template-1',	'en',	'I live in a giant {{ foo }}.',	'Text {{ foo }}.\r\nText {{ bar }}.\r\nText {{ baz }}.',	'<p>\r\nhtml {{ foo }}.\r\nhtml {{ bar }}.\r\nhtml {{ baz }}.\r\n</p>'),
(2,	'test-template-1',	'de',	'Ich lebe in einem riesigen {{ foo }}.',	'Text {{ foo }}.\r\nText {{ bar }}.\r\nText {{ baz }}.',	'<p>\r\nhtml {{ foo }}.\r\nhtml {{ bar }}.\r\nhtml {{ baz }}.\r\n</p>'),
(3,	'test-template-2',	'en',	'{{x}} and {{y}}',	'Some text but no HTML',	NULL);

-- 2020-11-22 02:59:49