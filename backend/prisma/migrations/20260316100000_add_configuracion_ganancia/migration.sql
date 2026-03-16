-- CreateTable
CREATE TABLE `configuracion_ganancia` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `categoria` ENUM('QUIOSCO', 'LIBRERIA', 'REGALERIA') NOT NULL,
    `porcentaje` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `actualizado_en` DATETIME(3) NOT NULL,

    UNIQUE INDEX `configuracion_ganancia_categoria_key`(`categoria`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
