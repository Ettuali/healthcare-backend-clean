  CREATE DATABASE  IF NOT EXISTS `day` 

  DROP TABLE IF EXISTS `assignedcoach`;

  CREATE TABLE `assignedcoach` (
    `id` int NOT NULL AUTO_INCREMENT,
    `userId` int NOT NULL,
    `coachId` int NOT NULL,
    `assignedOn` datetime DEFAULT CURRENT_TIMESTAMP,
    `updatedOn` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `userId` (`userId`),
    KEY `coachId` (`coachId`),
    CONSTRAINT `assignedcoach_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`),
    CONSTRAINT `assignedcoach_ibfk_2` FOREIGN KEY (`coachId`) REFERENCES `user` (`id`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


 
DROP TABLE IF EXISTS `assigneddoctor`;
CREATE TABLE `assigneddoctor` (
  `id` int NOT NULL AUTO_INCREMENT,
  `coachId` int NOT NULL,
  `doctorId` int NOT NULL,
  `assignedOn` datetime NOT NULL,
  `updatedOn` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `coachId` (`coachId`),
  KEY `doctorId` (`doctorId`),
  CONSTRAINT `assigneddoctor_ibfk_1` FOREIGN KEY (`coachId`) REFERENCES `user` (`id`),
  CONSTRAINT `assigneddoctor_ibfk_2` FOREIGN KEY (`doctorId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `assignedhospital`;

CREATE TABLE `assignedhospital` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `hospitalId` int NOT NULL,
  `assignedOn` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedOn` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId_idx` (`userId`),
  KEY `hospitalId_idx` (`hospitalId`),
  CONSTRAINT `hospitalId` FOREIGN KEY (`hospitalId`) REFERENCES `hospital` (`id`),
  CONSTRAINT `userId` FOREIGN KEY (`userId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `assignedhospital` VALUES (5,1,1,'2025-07-20 13:51:26','2025-07-20 13:51:26'),(6,2,1,'2025-07-20 13:51:26','2025-07-20 13:51:26'),(7,2,3,'2025-07-20 17:50:39','2025-07-20 17:50:39');



DROP TABLE IF EXISTS `doctoravailability`;
CREATE TABLE `doctoravailability` (
  `id` int NOT NULL AUTO_INCREMENT,
  `doctorId` int NOT NULL,
  `inTime` time NOT NULL,
  `outTime` time NOT NULL,
  `createdOn` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedOn` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `doctorId` (`doctorId`),
  CONSTRAINT `doctoravailability_ibfk_1` FOREIGN KEY (`doctorId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;




DROP TABLE IF EXISTS `hospital`;

CREATE TABLE `hospital` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `registrationNumber` varchar(100) DEFAULT NULL,
  `address` text,
  `contactNumber` varchar(20) DEFAULT NULL,
  `email` varchar(100) DEFAULT NULL,
  `createdAt` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `registrationNumber` (`registrationNumber`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
INSERT INTO `hospital` VALUES (1,'Ankura Hospitals','REG999888','Jubilee Hills, Hyderabad','9876543211','info@ankurahospitals.com','2025-07-20 13:30:14','2025-07-20 17:18:52'),(3,'Kims Hospitals','REG123457','Jubliee Hills, Hyderabad','9876543211','contact@kims.com','2025-07-20 17:13:49','2025-07-20 17:13:49');



DROP TABLE IF EXISTS `patientvitalslogs`;
CREATE TABLE `patientvitalslogs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `patientId` int NOT NULL,
  `temperature` decimal(5,2) DEFAULT NULL,
  `bloodPressure` varchar(20) DEFAULT NULL,
  `heartRate` int DEFAULT NULL,
  `oxygenSaturation` int DEFAULT NULL,
  `severityLevel` varchar(50) DEFAULT NULL,
  `postedBy` int DEFAULT NULL,
  `updatedBy` int DEFAULT NULL,
  `createdOn` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedOn` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `patientId` (`patientId`),
  KEY `postedBy` (`postedBy`),
  KEY `updatedBy` (`updatedBy`),
  CONSTRAINT `patientvitalslogs_ibfk_1` FOREIGN KEY (`patientId`) REFERENCES `user` (`id`),
  CONSTRAINT `patientvitalslogs_ibfk_2` FOREIGN KEY (`postedBy`) REFERENCES `user` (`id`),
  CONSTRAINT `patientvitalslogs_ibfk_3` FOREIGN KEY (`updatedBy`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `permissions`;

CREATE TABLE `permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `permissionName` varchar(255) NOT NULL,
  `createdOn` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedOn` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `raisedissues`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `raisedissues` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `coachId` int NOT NULL,
  `doctorId` int NOT NULL,
  `status` varchar(50) NOT NULL,
  `description` text NOT NULL,
  `raisedOn` datetime DEFAULT CURRENT_TIMESTAMP,
  `completedOn` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `coachId` (`coachId`),
  KEY `doctorId` (`doctorId`),
  CONSTRAINT `raisedissues_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`),
  CONSTRAINT `raisedissues_ibfk_2` FOREIGN KEY (`coachId`) REFERENCES `user` (`id`),
  CONSTRAINT `raisedissues_ibfk_3` FOREIGN KEY (`doctorId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


DROP TABLE IF EXISTS `rolepermissions`;

CREATE TABLE `rolepermissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roleId` int NOT NULL,
  `permissionId` int NOT NULL,
  `createdOn` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedOn` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `permissionId` (`permissionId`),
  CONSTRAINT `rolepermissions_ibfk_1` FOREIGN KEY (`permissionId`) REFERENCES `permissions` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;



DROP TABLE IF EXISTS `roles`;

CREATE TABLE `roles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `roleName` varchar(255) NOT NULL,
  `createdBy` int NOT NULL,
  `updatedBy` int DEFAULT NULL,
  `createdOn` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedOn` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `roles` VALUES (1,'hospital',1,1,'2025-07-20 13:26:44','2025-07-20 13:26:44');

CREATE TABLE `user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `phone` varchar(15) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `dob` date DEFAULT NULL,
  `gender` enum('Male','Female','Other') DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `verifiedPhone` tinyint(1) DEFAULT '0',
  `verifiedEmail` tinyint(1) DEFAULT '0',
  `createdBy` int DEFAULT NULL,
  `updatedBy` int DEFAULT NULL,
  `createdOn` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedOn` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `location` varchar(255) NOT NULL,
  `language` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `createdBy` (`createdBy`),
  KEY `updatedBy` (`updatedBy`),
  CONSTRAINT `user_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `user` (`id`),
  CONSTRAINT `user_ibfk_2` FOREIGN KEY (`updatedBy`) REFERENCES `user` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

INSERT INTO `user` VALUES (1,'Dr. Sana Malik','9123456780','sana.malik@example.com','$2b$10$asnSF9mTO2MjzuNyc6jWxuTWkxLZ3L95KPR1JPxvS/cbTeiO7sCFG','1988-03-21','Female','Active',0,0,NULL,NULL,'2025-07-20 07:51:37','2025-07-20 07:51:37','',NULL),(2,'Meera Sharma','9988776655','meera.sharma@example.com','$2b$10$xp50Zt6VltWmY6D4j1C45OO5jX6melaPVum9C9GRNDuo6gmdo0LIK','2000-06-05','Female','Active',0,0,NULL,NULL,'2025-07-20 08:06:33','2025-07-20 08:06:33','',NULL),(3,'Ettu Ali','9876543210','ehtesham@example.com','$2b$10$Bsa4aJWecjN8Lu.KCcgUbeyUKQS7QHZ7HWtX8JJI0VJY.xxM7OvgK','1995-07-16','Male','Active',0,0,1,NULL,'2025-07-20 10:55:54','2025-07-20 10:55:54','Hyderabad','Urdu');


CREATE TABLE `userdocuments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `documentType` varchar(255) NOT NULL,
  `documentName` varchar(255) NOT NULL,
  `uploadedOn` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedOn` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  CONSTRAINT `userdocuments_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;




CREATE TABLE `UserRole` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `roleId` int NOT NULL,
  `createdOn` datetime DEFAULT CURRENT_TIMESTAMP,
  `updatedOn` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `userId` (`userId`),
  KEY `roleId` (`roleId`),
  CONSTRAINT `UserRole_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `user` (`id`),
  CONSTRAINT `UserRole_ibfk_2` FOREIGN KEY (`roleId`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;


CREATE TABLE `wound` (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int DEFAULT NULL,
  `documentId` int NOT NULL,
  `woundMeasurement` varchar(45) NOT NULL,
  `createdBy` int NOT NULL,
  `updatedBy` int NOT NULL,
  `createdOn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedOn` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_userId_idx` (`userId`),
  KEY `documentId_idx` (`documentId`),
  CONSTRAINT `documentId` FOREIGN KEY (`documentId`) REFERENCES `userdocuments` (`id`),
  CONSTRAINT `fk_userId` FOREIGN KEY (`userId`) REFERENCES `user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;









-- 1. All Users View
CREATE OR REPLACE VIEW AllUsersListView AS
SELECT 
    u.id AS userId,
    u.name AS userName,
    u.phone,
    u.email,
    u.location,
    u.language,
    r.roleName,
    u.createdOn,
    u.updatedOn
FROM user u
LEFT JOIN userrole ur ON u.id = ur.userId
LEFT JOIN roles r ON ur.roleId = r.id;

-- 2. Doctor List View
CREATE OR REPLACE VIEW DoctorListView AS
SELECT 
    u.id AS doctorId,
    u.name AS doctorName,
    u.email,
    u.phone,
    u.location,
    h.name AS hospitalName,
    u.createdOn,
    u.updatedOn
FROM user u
JOIN userrole ur ON u.id = ur.userId
JOIN roles r ON ur.roleId = r.id AND r.roleName = 'doctor'
LEFT JOIN assignedhospital ah ON u.id = ah.userId
LEFT JOIN hospital h ON ah.hospitalId = h.id;

-- 3. Patient List View
CREATE OR REPLACE VIEW PatientListView AS
SELECT 
    u.id AS patientId,
    u.name AS patientName,
    u.email,
    u.phone,
    u.location,
    h.name AS hospitalName,
    u.createdOn,
    u.updatedOn
FROM user u
JOIN userrole ur ON u.id = ur.userId
JOIN roles r ON ur.roleId = r.id AND r.roleName = 'patient'
LEFT JOIN assignedhospital ah ON u.id = ah.userId
LEFT JOIN hospital h ON ah.hospitalId = h.id;

-- 4. Hospital List View
CREATE OR REPLACE VIEW HospitalListView AS
SELECT 
    h.id AS hospitalId,
    h.name AS hospitalName,
    h.registrationNumber,
    h.address,
    h.contactNumber,
    h.email,
    h.createdAt,
    h.updatedAt,
    u.name AS createdByName
FROM hospital h
LEFT JOIN user u ON h.id IN (
    SELECT hospitalId FROM assignedhospital WHERE userId = u.id
);

-- 5. Coach List View
CREATE OR REPLACE VIEW CoachListView AS
SELECT 
    coach.id AS coachId,
    coach.name AS coachName,
    coach.email AS coachEmail,
    coach.location AS coachLocation,
    d.id AS assignedDoctorId,
    d.name AS assignedDoctorName,
    p.id AS assignedPatientId,
    p.name AS assignedPatientName,
    p.email AS patientEmail,
    p.location AS patientLocation
FROM user coach
JOIN userrole ur ON coach.id = ur.userId
JOIN roles r ON ur.roleId = r.id AND r.roleName = 'coach'
LEFT JOIN assigneddoctor ad ON coach.id = ad.coachId
LEFT JOIN user d ON ad.doctorId = d.id
LEFT JOIN assignedcoach ac ON coach.id = ac.coachId
LEFT JOIN user p ON ac.userId = p.id;

-- 6. Admin Users View
CREATE OR REPLACE VIEW AdminUsersListView AS
SELECT 
    u.id AS adminId,
    u.name AS adminName,
    u.phone,
    u.email,
    u.location,
    u.language,
    u.createdOn,
    u.updatedOn
FROM user u
JOIN userrole ur ON u.id = ur.userId
JOIN roles r ON ur.roleId = r.id AND r.roleName = 'admin';

