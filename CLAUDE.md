# CLAUDE.md — Sistema de Gestión de Ventas y Stock
# Polirubro: Quiosco, Librería y Regalería

## Stack Tecnológico (DEFINITIVO)
- **Frontend:** React + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Base de datos:** MySQL via XAMPP (local, sin conexión a internet requerida)
- **ORM:** Prisma (para manejo de base de datos con tipado)
- **Estilos:** Tailwind CSS
- **Comunicación:** API REST (JSON)

## Comandos de Desarrollo
- `npm install` — instalar dependencias
- `npm run dev` — iniciar servidor de desarrollo
- `npm run build` — compilar para producción
- `npm run test` — ejecutar pruebas
- `npm run lint` — verificar estilo de código
- `npx prisma migrate dev` — aplicar migraciones de base de datos
- `npx prisma studio` — visualizar base de datos en el navegador

## Arquitectura de Carpetas
```
sistema-stock/
├── frontend/
│   └── src/
│       ├── components/     # Componentes visuales (PascalCase)
│       ├── pages/          # Vistas principales
│       ├── hooks/          # Custom hooks reutilizables
│       ├── services/       # Llamadas a la API
│       └── types/          # Tipos TypeScript compartidos
├── backend/
│   └── src/
│       ├── routes/         # Endpoints de la API
│       ├── controllers/    # Lógica de cada endpoint
│       ├── services/       # Reglas de negocio
│       ├── prisma/         # Schema y migraciones de BD
│       └── middlewares/    # Autenticación, validación, errores
└── CLAUDE.md
```

## Modelo de Datos (Entidades Principales)

### Producto
- `id` (auto, PK)
- `sku` — código único formato SKU-XXXX
- `nombre` — nombre del producto
- `categoria` — QUIOSCO | LIBRERIA | REGALERIA
- `precio_compra` — precio de costo
- `precio_venta` — precio de venta al público
- `stock_actual` — unidades disponibles
- `stock_minimo` — umbral para alerta de bajo stock (default: 5)
- `proveedor_id` (FK → Proveedor)
- `activo` — boolean (para dar de baja sin eliminar)
- `creado_en`, `actualizado_en`

### Venta
- `id` (auto, PK)
- `fecha_hora` — timestamp exacto
- `total` — monto total de la venta
- `items` → lista de ItemVenta

### ItemVenta (líneas de una venta)
- `id`
- `venta_id` (FK → Venta)
- `producto_id` (FK → Producto)
- `cantidad`
- `precio_unitario` — precio al momento de la venta (no cambia si el precio se edita después)
- `subtotal`

### Proveedor
- `id` (auto, PK)
- `nombre`
- `telefono`
- `email`
- `notas` — campo libre para observaciones

### MovimientoStock
- `id`
- `producto_id` (FK → Producto)
- `tipo` — ENTRADA | SALIDA | AJUSTE
- `cantidad`
- `motivo` — COMPRA | VENTA | DEVOLUCION | AJUSTE_MANUAL
- `fecha_hora`
- `referencia_id` — ID de venta o compra relacionada (opcional)

## Funcionalidades Requeridas

### Productos
- [ ] Alta, baja (lógica) y modificación de productos
- [ ] Búsqueda por nombre, SKU o categoría
- [ ] Edición de precio de venta y precio de costo
- [ ] Alerta visual cuando `stock_actual <= stock_minimo`
- [ ] Historial: fecha de última venta por producto

### Ventas
- [ ] Registrar venta (seleccionar productos + cantidades)
- [ ] Al confirmar venta: descontar stock automáticamente
- [ ] Resumen del día: total vendido, cantidad de transacciones, producto más vendido
- [ ] Reportes por: día, semana, mes y año
- [ ] Historial de ventas con filtro por fecha

### Stock
- [ ] Registrar entrada de mercadería (con proveedor asociado)
- [ ] Ajuste manual de stock con motivo obligatorio
- [ ] Vista de productos con bajo stock (panel de alertas)
- [ ] Historial de movimientos por producto

### Proveedores
- [ ] ABM de proveedores (Alta, Baja, Modificación)
- [ ] Ver qué productos trae cada proveedor
- [ ] Datos de contacto del proveedor

## Reglas de Negocio Importantes
1. **No permitir venta** si `stock_actual < cantidad_solicitada`
2. **Toda modificación de stock** debe registrarse en `MovimientoStock`
3. **El precio en ItemVenta** se guarda al momento de la venta y no se actualiza si el precio del producto cambia
4. **SKU único:** formato obligatorio `SKU-XXXX` donde XXXX son 4 dígitos
5. **Nunca eliminar** productos o proveedores de la base de datos; usar campo `activo = false`
6. **No modificar** archivos `.env` directamente; usar `.env.example` como plantilla

## Guía de Estilo de Código
- **Lenguaje:** TypeScript siempre (en frontend y backend)
- **Componentes:** Funcionales con Hooks, nunca clases
- **Módulos:** ES Modules (`import/export`), nunca `require()`
- **Archivos:** kebab-case (`product-card.tsx`)
- **Componentes:** PascalCase (`ProductCard`)
- **Variables y funciones:** camelCase (`stockActual`)
- **Respuestas API:** siempre `{ data, error, message }` como estructura base

## Contexto del Negocio
Es un local físico que vende en tres rubros:
- **Quiosco:** golosinas, bebidas, snacks, cigarrillos
- **Librería:** útiles escolares, papelería, impresiones
- **Regalería:** souvenirs, juguetes pequeños, artículos de regalo

El sistema corre localmente (sin nube). El usuario no es técnico,
por lo que la interfaz debe ser simple, clara y en español.