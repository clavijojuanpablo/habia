---
name: verificar
description: Ejecuta la verificacion completa de habia (typecheck, lint, tests y, si se tocaron nativos o el bundle, export web) e interpreta los fallos. Usala antes de dar por terminada cualquier tarea de codigo y antes de commitear.
---

# Verificar

Nada se declara terminado sin esto. El orden no es casual: va de lo rapido y barato a lo lento, y cada paso descarta una clase distinta de error.

## 1. Typecheck (~8 s)

```bash
npm run typecheck
```

Detecta contratos rotos: props que ya no existen, tipos de Supabase desactualizados, imports muertos. Si cambiaste el esquema de la base de datos y aparecen errores en `database.types.ts`, no los parchees a mano: regenera los tipos (skill `/migracion`).

## 2. Tests (~7 s)

```bash
npm test
```

Cubren la logica pura: recurrencia, reglas de check-in, rachas, jardin, stacking. Si tocaste una de esas areas y ningun test fallo ni se agrego, sospecha: probablemente falta un caso borde.

## 3. Lint (~25 s en Windows)

```bash
npm run lint
```

Es el paso lento (la config flat de Expo carga mucho). Por eso **no corre como hook en cada edicion**: correrlo despues de cada `Edit` anadiria ~25 s a cada cambio. Corre aqui, una vez, al final.

Reglas que suelen saltar en este proyecto:
- `react-hooks/set-state-in-effect`: casi siempre la solucion es **derivar** el valor al renderizar en vez de guardarlo en estado.
- Claves duplicadas en `StyleSheet.create` (TS1117): las pilla el typecheck, no el lint.

## 4. Bundle, solo si aplica

Si tocaste dependencias nativas, `app.json`, assets o codigo con archivos por plataforma (`.web.ts`):

```bash
npx expo export --platform web
```

Verifica que el bundle compila de verdad en web, donde Skia carga `public/canvaskit.wasm` bajo demanda. Un import que solo existe en nativo revienta aqui y no en los pasos anteriores.

## Al terminar

Reporta los numeros reales (por ejemplo "86 tests, 12 suites, todo en verde"). Si algo falla y lo arreglas, **vuelve a correr desde el paso 1**: un arreglo de lint puede romper tipos.

Si un paso falla y decides no arreglarlo ahora, dilo explicitamente con el error textual. Nunca reportes verde parcial.
