ALTER TABLE `transport`
ADD `domain` varchar(255) NULL;

UPDATE transport t
JOIN mailgunSettings mg ON mg.transportId = t.id
SET t.domain = mg.domain;

ALTER TABLE `mailgunSettings`
DROP `domain`;

