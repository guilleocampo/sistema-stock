# Comando: Reporte del Día

Generá un reporte completo de ventas. Preguntar primero el período:

## Opciones de período
- Hoy
- Esta semana (lunes a hoy)
- Este mes
- Este año
- Rango personalizado (pedir fecha desde / fecha hasta)

## Datos a incluir en el reporte

### Resumen general
- Total recaudado en el período
- Cantidad de transacciones (ventas realizadas)
- Ticket promedio (total / cantidad de ventas)

### Top productos
- Los 5 productos más vendidos (por cantidad de unidades)
- Los 5 productos más vendidos (por monto generado)

### Productos sin movimiento
- Productos que NO tuvieron ventas en el período seleccionado
- Mostrar cuántos días llevan sin venderse

### Desglose por categoría
- Total vendido en QUIOSCO
- Total vendido en LIBRERIA
- Total vendido en REGALERIA

### Detalle de ventas (solo si el período es "Hoy" o un día específico)
- Listado hora por hora de cada venta con su total

## Generá el código para
- Query Prisma con los filtros de fecha correspondientes
- Agrupar por producto, categoría y hora según corresponda
- Endpoint GET `/api/reportes?periodo=hoy|semana|mes|anio&desde=&hasta=`
- Respuesta en formato `{ data, error, message }`

## Contexto
- Todos los montos en pesos argentinos
- Formato de fecha: DD/MM/YYYY HH:mm
