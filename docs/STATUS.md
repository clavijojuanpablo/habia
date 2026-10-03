# STATUS — dónde está el proyecto hoy

**Última actualización: 2026-10-03.** Es el punto de entrada de cada sesión: un hook `SessionStart` lo inyecta al
arrancar. Mantenlo corto y verdadero. La vista larga vive en otros documentos:

| Documento | Qué responde |
| --- | --- |
| `ROADMAP.md` | Qué está hecho, qué sigue y el backlog de ideas |
| `DECISIONS.md` | Por qué las cosas son como son (decisiones con fecha, ideas descartadas) |
| `RELEASES.md` | Qué salió en cada versión |
| `ARCHITECTURE.md` | Sistema, modelo de datos y reglas técnicas |
| `PRD.md` · `SCIENCE.md` · `GAMIFICATION.md` · `BRAND.md` | Alcance del producto, la ciencia detrás de cada función, el árbol y el personaje, voz y estilo |
| `CHARACTER-ART.md` | La guía de arte para dibujar las piezas del personaje |

---

## Ahora mismo

**habia 1.6.4 sobre la build 1.6.0 (5)**, en TestFlight (pruebas internas). Todo esto funciona en el iPhone del
dueño (confirmado el 2026-10-03): hábitos con cualquier recurrencia soportada, Hoy / Semana, árbol de identidad,
Progreso, coach por reglas, revisión semanal con IA, **modo enfoque**, **chat con Brote**, amigos, círculos
alrededor de un hábito compartido (racha de grupo, fotos, votos «¿Cuenta?»), notificaciones push sociales y
habia Pro (pantalla de pago y compras de prueba; límites apagados).

- **Ramas:** toda la 1.6.x vive en **`build-4`**, sin unir. `main` sigue apuntando a la huella de la build 3
  (`f15932ef…`). La huella de la build 5 es **`23ecb1f2…`**; todas las OTA desde la 1.6.0 salieron de `build-4`.
- **Servidor:** 18 migraciones aplicadas, 6 Edge Functions desplegadas (`delete-account`, `weekly-review`,
  `coach-chat`, `notify`, `photos-cleanup`, `revenuecat-webhook`), limpieza de fotos programada con pg_cron
  (03:30 UTC).
- **Pro:** RevenueCat y App Store Connect configurados (productos `habia_pro_annual` / `habia_pro_monthly`,
  entitlement `pro`, offering `default`, webhook → `entitlements`). `PRO_LIMITS_ENABLED = false`: todo es gratis y
  la pantalla de pago lo dice.

## Próximos pasos

1. **Unir `build-4` a `main`** (la build 5 ya es la de los testers) y pedir a los testers que actualicen en
   TestFlight. Desde ese momento las OTA salen de `main` y deben dar la huella `23ecb1f2…`.
2. **Probar el detector de patrones** con una cuenta de prueba sembrada (30 días de registros con patrones a
   propósito) y preguntarle a Brote «¿Qué hábitos me conviene hacer juntos?». Con uso real hacen falta 2–3
   semanas (5+ días a cada lado de un par de hábitos).
3. **Siguientes funciones** (ROADMAP → *Siguiente*): consejo «subir de nivel» (gratis), informe del mes (Pro) y
   luego activar los límites de Pro con candado en el servidor.
4. **Personaje:** el dueño dibuja el lote 1 (`CHARACTER-ART.md`); el código arranca cuando existan las primeras
   piezas.
5. **La próxima semana (dueño):** tareas de App Store — reemplazar la captura temporal de revisión de las dos
   suscripciones por la pantalla de pago real, App Privacy (historial de compras, fotos) y volver a publicar la
   web con los textos legales nuevos.

## Cómo retomar

1. Este archivo. 2. `ROADMAP.md` → *Ahora / Siguiente*. 3. `CLAUDE.md` para las convenciones. 4. `DECISIONS.md`
antes de reabrir una pregunta ya decidida.

## Estado técnico

- Expo SDK 57 (RN 0.86), Expo Router, TypeScript estricto; proyecto Supabase en la nube «Habits Project».
- **Línea base de verificación:** 193 tests en verde, typecheck y lint limpios. Las pruebas de base de datos
  corren contra el proyecto enlazado dentro de `BEGIN … ROLLBACK`:
  `supabase/tests/{social-rls,entitlements-rls,circle-start,coach-chat-rls}.sql`.
- **Publicar:**
  - Solo JavaScript → `npx eas-cli@latest update --channel production --environment production --platform ios --message "…"`.
    Antes: `npx expo-updates runtimeversion:resolve --platform ios` debe imprimir la huella de la build de los testers.
  - Cambio nativo → `npx eas-cli@latest build --profile production --platform ios --auto-submit` (número de build
    nuevo y luego TestFlight).
  - La base primero: `npx supabase db push` (y `functions deploy …`) **antes** de una OTA cuya app lea tablas nuevas.
- **Versiones:** `APP_RELEASE` (`src/constants/release.ts`) es lo que ve la gente: patch = OTA, minor = binario
  nuevo (y `version` de `app.json` sube con él). Los números de build los lleva EAS y suben solos; una build fallida
  igual gasta su número.
- **Código compartido con el servidor:** módulos puros copiados a `supabase/functions/_shared/` con
  `node scripts/sync-shared.js` (recurrencia, hora local, resumen semanal, patrones); un test falla si se
  desincronizan.

## Deudas conocidas

- **Trampas de la huella:** `.gitignore`, `eas.json`, `app.json`, los assets y los paquetes nativos mueven la
  huella. Una OTA con la huella movida no le llega a ningún teléfono.
- **Lo que se persiste en la caché debe ser JSON** (nada de Map/Set/Date en un `queryFn`); las URLs firmadas de
  fotos quedan fuera de la caché persistida (`meta: { persist: false }`).
- **PostgREST corta las listas en 1000 filas:** toda lista que pueda crecer pagina con `.order(…).range(…)` y un
  desempate único (`useLogs`, `circle_habit_days`, `coach-chat`).
- **Pro antes del lanzamiento:** el límite de 5 hábitos solo lo aplica la interfaz; falta un trigger en la base que
  lea `entitlements` antes de activar los límites. El chat se cierra a Pro desde el servidor
  (`CHAT_REQUIRES_PRO`); la revisión semanal todavía no tiene candado.
- **Modo enfoque:** si iOS cierra la app en segundo plano, la sesión se pierde (el aviso dice «vuelve para
  sembrar» y el check-in espera al usuario). Guardar la sesión en el teléfono lo arreglaría.
- **Hora:** el «hoy» de la app sale del reloj del teléfono; el servidor usa `profiles.timezone`. Coinciden mientras
  `use-timezone-sync.ts` mantenga la zona sincronizada.
- **Social:** los reportes se revisan a mano (`public.reports`); los códigos de invitación no tienen límite de
  intentos; en un hábito de dos personas un voto «¿Cuenta?» se puede deducir (la app y el texto legal lo dicen).
- **La revisión semanal** se escribe en la primera visita a Hoy de la semana (no hay cron); pasarla a la Batch API
  necesita un cron.
- **Skia:** Shopify deja de patrocinar `react-native-skia` a fin de 2026; revisar el fork en la próxima
  actualización del SDK (plan B: el árbol en react-native-svg).
- **Vistas previas web:** exportar con `EXPO_NO_DOTENV=1` + variables falsas de Supabase (una vez una vista previa
  reportó al Sentry real). Windows no dibuja banderas emoji: en la web se ve ES / EN.
- **Legal:** jurisdicción sin confirmar, sin revisión de abogado; la analítica es opt-out (la UE pediría opt-in).
- Menores: tres componentes de chip casi iguales (unificar al cuarto); el fondo de la hoja de acciones se desliza
  con la hoja; el idioma de los correos se fija solo al registrarse; la tabla `garden_state` no se usa (el jardín se
  calcula en el teléfono sobre 120 días); la build de desarrollo de iOS es anterior al dominio asociado.

## Solo el dueño puede hacer esto

- Guardar secretos (EAS env, secretos de Supabase) — pegándolos con las funciones del portapapeles, nunca en el
  prompt oculto.
- Correr `db push`, `functions deploy`, las OTA y las builds.
- Los paneles de App Store Connect y RevenueCat; testers de TestFlight; respuestas de App Privacy.
- Dibujar las piezas del personaje. Revisar `public.reports` de vez en cuando.
- Apple Developer se renueva cada año (US$99, próxima vez 2027-09-28).

---

**Mantenimiento:** actualizar al final de cada bloque de trabajo (skill `/cerrar-sesion`). Un STATUS
desactualizado es peor que ninguno: la siguiente sesión confía en él.
