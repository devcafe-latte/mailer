ALTER TABLE `mailgunSettings`
ADD `domain` varchar(255) NULL;

UPDATE transport t
JOIN mailgunSettings mg ON mg.transportId = t.id
SET mg.domain = t.domain;

ALTER TABLE `transport`
DROP `domain`;