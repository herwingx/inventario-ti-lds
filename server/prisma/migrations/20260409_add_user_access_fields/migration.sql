ALTER TABLE `usuarios_sistema`
    ADD COLUMN `nombres` VARCHAR(100) NULL AFTER `email`,
    ADD COLUMN `apellidos` VARCHAR(100) NULL AFTER `nombres`;
