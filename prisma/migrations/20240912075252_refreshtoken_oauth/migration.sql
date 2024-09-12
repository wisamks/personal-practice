-- AlterTable
ALTER TABLE `user` ADD COLUMN `provider` VARCHAR(6) NULL,
    ADD COLUMN `providerId` TEXT NULL,
    ADD COLUMN `refresh_token` TEXT NULL;
