# Comando: Nuevo Producto

Voy a añadir un nuevo producto al sistema. Seguí este flujo exacto:

## 1. Pedime estos datos (uno por uno, en español)
- Nombre del producto
- Categoría (QUIOSCO | LIBRERIA | REGALERIA)
- Precio de costo (precio_compra)
- Precio de venta (precio_venta)
- Stock inicial (unidades disponibles ahora)
- Stock mínimo (¿cuántas unidades mínimas antes de alertar? default: 5)
- Proveedor (mostrar lista de proveedores existentes para elegir)

## 2. Generá automáticamente
- SKU único con formato SKU-XXXX (buscar el último SKU en la BD e incrementar)
- Fecha de creación (timestamp actual)
- Campo `activo: true`

## 3. Validaciones antes de guardar
- El nombre no puede estar vacío
- precio_venta debe ser mayor que precio_compra
- stock_minimo no puede ser negativo
- Si el proveedor no existe, ofrecer crear uno nuevo

## 4. Al confirmar, generá el código necesario para
- Insertar el producto en la tabla `Producto` vía Prisma
- Registrar un movimiento en `MovimientoStock` con tipo ENTRADA y motivo AJUSTE_MANUAL
- Mostrar resumen del producto creado con su SKU asignado

## Contexto
- Base de datos: MySQL via Prisma ORM
- Validaciones en el backend (Express)
- Respuesta API: `{ data, error, message }`
