
CREATE TABLE `transport` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `name` varchar(255) NOT NULL,
  `type` varchar(100) NOT NULL,
  `active` tinyint NOT NULL,
  `weight` int NULL,
  `default` tinyint NOT NULL
);

CREATE TABLE `mailgunSettings` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `apiKey` varchar(255) NOT NULL,
  `domain` varchar(255) NOT NULL,
  `host` varchar(255) NOT NULL,
  `transportId` int NOT NULL,
  FOREIGN KEY (`transportId`) REFERENCES `transport` (`id`) ON DELETE CASCADE
);

CREATE TABLE `smtpSettings` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `server` varchar(255) NOT NULL,
  `port` int NOT NULL,
  `user` varchar(255) NOT NULL,
  `pass` varchar(255) NOT NULL,
  `secure` tinyint NOT NULL,
  `transportId` int NOT NULL,
  FOREIGN KEY (`transportId`) REFERENCES `transport` (`id`) ON DELETE CASCADE
);

CREATE TABLE `sendInBlueSettings` (
  `id` int NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `apiKey` varchar(255) NOT NULL,
  `apiUrl` varchar(255) NOT NULL,
  `transportId` int NOT NULL,
  FOREIGN KEY (`transportId`) REFERENCES `transport` (`id`) ON DELETE CASCADE
);

ALTER TABLE `email`
ADD `transportId` int NULL,
ADD FOREIGN KEY (`transportId`) REFERENCES `transport` (`id`) ON DELETE SET NULL;