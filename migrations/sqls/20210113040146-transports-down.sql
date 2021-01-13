ALTER TABLE `email`
DROP FOREIGN KEY `email_ibfk_1`,
DROP INDEX `transportId`,
DROP `transportId`;

DROP TABLE `mailgunSettings`; 
DROP TABLE `smtpSettings`; 
DROP TABLE `sendInBlueSettings`; 
DROP TABLE `transport`;
