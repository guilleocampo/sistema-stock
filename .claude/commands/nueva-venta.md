# Comando: Nueva Venta

Voy a registrar una nueva venta. Seguí este flujo exacto:

## 1. Modo de carga de productos
Permitir agregar múltiples productos a la venta:
- Buscar producto por nombre o SKU
- Ingresar cantidad deseada
- Mostrar precio unitario y subtotal al instante
- Repetir hasta que el usuario diga "listo" o "confirmar"

## 2. Validaciones por cada producto agregado
- Verificar que `stock_actual >= cantidad_solicitada`
- Si no hay stock suficiente: mostrar alerta y NO permitir continuar
- Si el producto no existe: avisar y pedir otro

## 3. Resumen antes de confirmar
Mostrar tabla con:
- Producto | Cantidad | Precio unit. | Subtotal
- Total general de la venta

## 4. Al confirmar, generá el código para
- Crear registro en tabla `Venta` con timestamp actual
- Crear registros en `ItemVenta` por cada producto (guardar precio_unitario del momento)
- Descontar stock en tabla `Producto` por cada ítem
- Registrar en `MovimientoStock` tipo SALIDA, motivo VENTA, con referencia al ID de venta
- Retornar resumen de venta con ID generado

## 5. Post-venta
- Mostrar comprobante simple con ID de venta y total
- Verificar si algún producto quedó con stock <= stock_minimo y lanzar alerta si es así

## Contexto
- Nunca modificar precio_venta del producto al registrar la venta
- El precio se copia a ItemVenta en el momento exacto de la venta
- Base de datos: MySQL via Prisma ORM
