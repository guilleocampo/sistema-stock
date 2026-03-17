-- CreateIndex
CREATE INDEX `productos_categoria_idx` ON `productos`(`categoria`);

-- CreateIndex
CREATE INDEX `ventas_fecha_hora_idx` ON `ventas`(`fecha_hora`);
