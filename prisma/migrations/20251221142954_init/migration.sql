/*
  Warnings:

  - You are about to alter the column `usedAmount` on the `UserVoucher` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(12,2)`.
  - You are about to alter the column `remainAmount` on the `UserVoucher` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(12,2)`.

*/
-- AlterTable
ALTER TABLE `UserVoucher` MODIFY `usedAmount` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    MODIFY `remainAmount` DECIMAL(12, 2) NOT NULL;
