/*
  Warnings:

  - Added the required column `subtotal_sin_impuestos` to the `ventas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `productos` ADD COLUMN `porcentaje_iva` DECIMAL(5, 2) NOT NULL DEFAULT 21.0,
    ADD COLUMN `tiene_iva` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: subtotal_sin_impuestos usa total existente como default temporal
ALTER TABLE `ventas` ADD COLUMN `impuesto_iva` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `impuesto_metodo_pago` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `subtotal_sin_impuestos` DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Poblar subtotal_sin_impuestos con el total de cada venta existente
UPDATE `ventas` SET `subtotal_sin_impuestos` = `total`;

-- Quitar el default para que sea obligatorio en nuevas inserciones
ALTER TABLE `ventas` ALTER COLUMN `subtotal_sin_impuestos` DROP DEFAULT;

-- CreateTable
CREATE TABLE `configuracion_impuesto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `porcentaje` DECIMAL(5, 2) NOT NULL,
    `tipo` ENUM('POR_METODO_PAGO', 'POR_PRODUCTO') NOT NULL,
    `metodo_pago` ENUM('EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO') NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `actualizado_en` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
