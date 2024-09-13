/*
  Warnings:

  - Made the column `provider` on table `user` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `user` MODIFY `provider` ENUM('google', 'naver', 'kakao') NOT NULL;
