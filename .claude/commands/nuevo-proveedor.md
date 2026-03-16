# Comando: Nuevo Proveedor

Voy a registrar un nuevo proveedor. Seguí este flujo:

## 1. Pedime estos datos
- Nombre del proveedor o empresa (obligatorio)
- Teléfono de contacto
- Email de contacto
- Notas adicionales (días de entrega, condiciones, etc.) — opcional

## 2. Validaciones
- El nombre no puede estar vacío ni repetido
- Si ya existe un proveedor con ese nombre, avisar y preguntar si es el mismo

## 3. Asociación de productos
Después de crear el proveedor, preguntar:
- ¿Este proveedor ya trae productos que están cargados en el sistema?
- Si sí: mostrar lista de productos sin proveedor asignado para vincular

## 4. Al confirmar, generá el código para
- Insertar en tabla `Proveedor`
- Si se eligieron productos: actualizar `proveedor_id` en tabla `Producto`
- Mostrar resumen del proveedor creado con sus productos asociados

## Contexto
- Los proveedores nunca se eliminan físicamente (usar activo = false si se da de baja)
- Un producto puede tener un solo proveedor principal
