# Comando: Analizar Sistema Completo

Realizá un análisis profundo del proyecto SIN modificar
ningún archivo. Solo leer, analizar y reportar.

## REGLAS ESTRICTAS
- NO modificar ningún archivo durante este análisis
- NO refactorizar nada sin aprobación explícita
- SOLO reportar hallazgos con explicación y propuesta
- Cada sugerencia debe indicar: qué es, por qué cambiarlo,
  qué beneficio trae y qué riesgo tiene

## 1. ANÁLISIS DE BASE DE DATOS
Leer: backend/prisma/schema.prisma

Verificar:
- Campos duplicados entre tablas
- Campos que se definen pero nunca se usan en el código
- Relaciones que podrían optimizarse
- Índices que faltan en campos usados frecuentemente
  en filtros (fecha_hora, producto_id, categoria)
- Tipos de datos incorrectos (ej: usar String donde
  debería ser Decimal)

## 2. ANÁLISIS DEL BACKEND
Leer todos los archivos en: backend/src/

Verificar:
- Endpoints duplicados o que hacen lo mismo
- Lógica de negocio repetida en múltiples controllers
  que podría moverse a un service compartido
- Queries de Prisma sin paginación que podrían
  devolver miles de registros
- Validaciones inconsistentes entre endpoints
- Manejo de errores incompleto (try/catch faltantes)
- Variables de entorno hardcodeadas en el código
- Console.log de debug que quedaron del desarrollo

## 3. ANÁLISIS DEL FRONTEND
Leer todos los archivos en: frontend/src/

Verificar:
- Componentes similares que podrían unificarse
- Llamadas al backend duplicadas en múltiples páginas
  que podrían centralizarse en un service/hook
- Estados (useState) que se podrían simplificar
- Cálculos repetidos que podrían ser useMemo
- Imágenes o assets sin optimizar
- Console.log de debug que quedaron

## 4. ANÁLISIS DE SEGURIDAD
Verificar:
- Datos sensibles expuestos en respuestas de la API
  (contraseñas, tokens, datos internos)
- Endpoints que deberían estar protegidos y no lo están
- Validación de inputs en el backend
- CORS configurado correctamente

## 5. FORMATO DEL REPORTE
Presentar los hallazgos así:

### 🔴 CRÍTICO (rompe funcionalidad o seguridad)
[hallazgo]
→ Archivo: ruta/del/archivo.ts
→ Por qué es un problema: explicación
→ Cómo corregirlo: solución concreta
→ Riesgo de tocarlo: bajo/medio/alto

### 🟡 MEJORA (optimización recomendada)
[hallazgo]
→ Archivo: ruta/del/archivo.ts
→ Beneficio: qué mejora (rendimiento/legibilidad/mantenimiento)
→ Cómo implementarlo: explicación
→ Riesgo de tocarlo: bajo/medio/alto

### 🟢 SUGERENCIA (buenas prácticas)
[hallazgo]
→ Archivo: ruta/del/archivo.ts
→ Por qué es mejor: explicación
→ Riesgo de tocarlo: bajo

## 6. RESUMEN FINAL
Al terminar el análisis mostrar:
- Total de hallazgos críticos
- Total de mejoras sugeridas
- Total de sugerencias
- Orden recomendado para aplicar los cambios
- Estimación de impacto: qué cambios dan más beneficio
  con menos riesgo
