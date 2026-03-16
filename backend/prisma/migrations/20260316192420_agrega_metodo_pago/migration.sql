/*
  Warnings:

  - Added the required column `metodo_pago` to the `ventas` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable: agregar columna con default temporal para filas existentes
ALTER TABLE `ventas` ADD COLUMN `metodo_pago` ENUM('EFECTIVO', 'TRANSFERENCIA', 'DEBITO', 'CREDITO') NOT NULL DEFAULT 'EFECTIVO';
-- Quitar el default para que sea obligatorio en nuevas inserciones
ALTER TABLE `ventas` ALTER COLUMN `metodo_pago` DROP DEFAULT;
