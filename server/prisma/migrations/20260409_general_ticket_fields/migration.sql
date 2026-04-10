ALTER TABLE `tickets`
    MODIFY COLUMN `id_equipo` INT NULL,
    ADD COLUMN `titulo` VARCHAR(150) NULL AFTER `token_acceso`,
    ADD COLUMN `categoria` VARCHAR(100) NULL AFTER `titulo`;
