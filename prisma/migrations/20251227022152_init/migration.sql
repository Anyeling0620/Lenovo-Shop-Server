-- AlterTable
ALTER TABLE `Admin` ADD COLUMN `gender` ENUM('man', 'woman', 'secret') NOT NULL DEFAULT 'secret';
