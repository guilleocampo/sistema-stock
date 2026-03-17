# Security Check — Auditoría de Seguridad del Sistema

Realizá una auditoría de seguridad completa del proyecto siguiendo estos pasos en orden. Para cada hallazgo: indicá el archivo y línea, describí el problema, mostrá cómo corregirlo y cómo verificar que quedó bien.

---

## 1. Autenticación y JWT

### Qué revisar

**Expiración de tokens:**
- Buscá dónde se genera el JWT (`jwt.sign`). Verificá que tenga `expiresIn` definido y que sea razonable (ej: `'15m'` para access token, `'7d'` para refresh token).
- Buscá dónde se verifica el JWT (`jwt.verify`). Confirmá que los errores de expiración (`TokenExpiredError`) se manejan y devuelven 401, no 500.

**Headers de seguridad:**
- Verificá que el backend usa `helmet` (o equivalente). Si no está, agregalo.
- Confirmá que las respuestas incluyen: `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security` (si hay HTTPS).

**Rate limiting en login:**
- Buscá la ruta `/api/auth/login`. Verificá que tiene middleware de rate limiting (ej: `express-rate-limit`).
- Si no existe, instalá e implementá:

```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo 10 intentos
  message: { error: 'Demasiados intentos. Intentá en 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/login', loginLimiter, authController.login);
```

### Cómo verificar
- `npm audit` no debe mostrar vulnerabilidades críticas en `jsonwebtoken` o `express-rate-limit`.
- Intentá 11 requests seguidos a `/api/auth/login` — el 11° debe devolver 429.
- Decodificá un token en jwt.io y confirmá que tiene campo `exp`.

---

## 2. Base de Datos

### Qué revisar

**SQL Injection via Prisma:**
- Buscá cualquier uso de `prisma.$queryRaw` o `prisma.$executeRaw`. Si usan template literals con variables de usuario, es vulnerable.
- El uso correcto es con tagged templates: `prisma.$queryRaw\`SELECT * FROM productos WHERE id = ${id}\`` — Prisma parametriza automáticamente.
- Los métodos normales de Prisma (`findMany`, `findUnique`, `create`, `update`) son seguros por diseño. No requieren cambios.

**Campos sensibles en respuestas API:**
- Buscá el modelo `Usuario` (o similar) en el schema de Prisma. Identificá campos como `password`, `hash`, `token`, `secret`.
- En cada controller que devuelva usuarios, verificá que esos campos se excluyan explícitamente:

```typescript
// MAL — expone el hash
return prisma.usuario.findUnique({ where: { id } });

// BIEN — excluye campos sensibles
return prisma.usuario.findUnique({
  where: { id },
  select: {
    id: true,
    nombre: true,
    email: true,
    rol: true,
    // password: omitido intencionalmente
  },
});
```

### Cómo verificar
- Hacé un GET a `/api/usuarios/:id` y confirmá que la respuesta JSON no contiene `password`, `hash` ni ningún campo secreto.
- Revisá el schema de Prisma y listá todos los campos marcados como sensibles.

---

## 3. Frontend

### Qué revisar

**Variables de entorno expuestas en el bundle:**
- Abrí `vite.config.ts`. Verificá que no haya variables secretas (claves de API, passwords) en `define` o `import.meta.env`.
- En Vite, SOLO las variables con prefijo `VITE_` se exponen al frontend. Nunca pongas `VITE_DB_PASSWORD` ni similares.
- Buscá en todo el frontend (`frontend/src/**`) usos de `import.meta.env` y listá cada variable usada. Para cada una, verificá que no sea un secreto.
- Revisá `.env` del frontend: debe contener solo URLs de API (`VITE_API_URL=http://localhost:3000`), nunca credenciales.

**Rutas protegidas:**
- Buscá el componente de rutas (generalmente `App.tsx` o `Router.tsx`). Identificá las rutas que requieren autenticación.
- Verificá que exista un componente tipo `ProtectedRoute` o `RequireAuth` que redirija a `/login` si no hay token válido.
- Confirmá que el token se valida en el cliente (verificando expiración local) antes de hacer requests, no solo en el backend.

```typescript
// Verificación básica de expiración en cliente
const isTokenValid = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};
```

### Cómo verificar
- Ejecutá `npm run build` en el frontend y luego buscá en `dist/assets/*.js` con grep alguna clave o credencial sospechosa.
- Intentá acceder a una ruta protegida sin token — debe redirigir a login.

---

## 4. Backend

### Qué revisar

**CORS configurado correctamente:**
- Buscá la configuración de CORS en el backend (generalmente en `app.ts` o `server.ts`).
- Verificá que `origin` no sea `'*'` en producción. Debe ser el dominio específico permitido.

```typescript
// MAL — permite cualquier origen
app.use(cors());

// BIEN — solo permite el origen del frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
```

**Variables de entorno no hardcodeadas:**
- Buscá en todo `backend/src/**` strings que parezcan credenciales hardcodeadas: contraseñas, claves JWT, connection strings con usuario/password, etc.
- Usá este patrón de búsqueda: `password\s*=\s*['"]`, `secret\s*=\s*['"]`, `mysql://`.
- Si encontrás alguna, movela a `.env` inmediatamente y reemplazá por `process.env.VARIABLE`.
- Verificá que `.env` está en `.gitignore` y que existe `.env.example` con las claves pero sin valores reales.

**Dependencias con vulnerabilidades:**
- Ejecutá `npm audit` en ambas carpetas (`frontend/` y `backend/`).
- Para cada vulnerabilidad `high` o `critical`, ejecutá `npm audit fix`.
- Si `npm audit fix` no resuelve alguna, documentá el motivo (ej: breaking change) y buscá alternativa.

### Cómo verificar
- Hacé un request desde un origen diferente al permitido y confirmá que el servidor responde con error CORS.
- Buscá en el repositorio (incluyendo historial de git con `git log -S "password"`) si alguna credencial fue commiteada alguna vez.
- `npm audit` debe terminar con 0 vulnerabilidades críticas o altas.

---

## Formato de reporte final

Al terminar la auditoría, generá un resumen con esta estructura:

```
## Resumen de Auditoría de Seguridad

### Problemas Críticos (requieren fix inmediato)
- [ ] ...

### Problemas Medios (fix en próxima iteración)
- [ ] ...

### Sin problemas encontrados
- [x] ...

### Recomendaciones adicionales
- ...
```
