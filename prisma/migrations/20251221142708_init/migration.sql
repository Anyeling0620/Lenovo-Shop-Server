/*
  Warnings:

  - You are about to alter the column `originalAmount` on the `Voucher` table. The data in that column could be lost. The data in that column will be cast from `Decimal(10,2)` to `Decimal(12,2)`.

*/
-- AlterTable
ALTER TABLE `Voucher` MODIFY `originalAmount` DECIMAL(12, 2) NOT NULL;
