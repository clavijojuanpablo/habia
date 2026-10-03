# Arquitectura

```
App Expo (iOS / Android / Web) — un solo código
 ├─ Expo Router: pestañas Hoy · Semana · Jardín · Progreso · Perfil, más rutas modales
 │    (habit, identity, settings, streak, circles, circle, friend, cheers, friends, paywall, focus, brote)
 ├─ TanStack Query ⇄ supabase-js (Auth + Postgres con RLS), caché persistida 7 días (solo JSON)
 ├─ Motor de recurrencia (src/lib/recurrence) → ocurrencias de cualquier rango, en hora local
 ├─ Notificaciones locales (expo-notifications): recordatorios, fin del enfoque; token push para lo social
 ├─ Fotos con cámara (expo-image-picker / -manipulator) + cola de subida en el teléfono
 ├─ SDK de RevenueCat (iOS) → usePro()
 ├─ Skia (árbol, cielo); gráficas con Views + react-native-svg; Reanimated para el movimiento
 ├─ Sentry (errores, usuario = id interno) · PostHog (lista cerrada de eventos, opt-out)
 └─ Módulos puros con tests: recurrencia, detectores del coach, resumen semanal, patrones, racha de círculo,
    temporizador de enfoque

Supabase (proyecto en la nube «Habits Project»)
 ├─ Postgres + RLS en todas las tablas; helpers SECURITY DEFINER en el esquema `private`
 ├─ Storage: bucket `circle-photos` (privado, JPEG de 1 MB, carpeta = círculo/hábito/autor)
 ├─ pg_cron (03:30 UTC) → photos-cleanup
 ├─ Edge Functions (Deno):
 │    delete-account · weekly-review (Claude Sonnet) · coach-chat (Claude Haiku)
 │    notify (push sociales por Expo Push) · photos-cleanup (CRON_SECRET) · revenuecat-webhook
 │    └─ _shared/: los módulos puros de la app, copiados por scripts/sync-shared.js (un test falla si difieren)
 └─ Correos de acceso: supabase/templates/ → SMTP de Resend → hola@habia.app

RevenueCat ⇄ App Store → webhook → public.entitlements        API de Anthropic ← weekly-review, coach-chat
habia.app (DNS en Hostinger) → Vercel: web/ (Astro; las páginas legales importan src/features/legal/content.ts)
```

## Modelo de datos (`supabase/migrations/`, 18 aplicadas)

**Personal**
- `profiles` — zona horaria, idioma, horas de las franjas, tema, `ai_coach_enabled`, `social_push`,
  `best_streak`, `onboarded_at`. Se crea al registrarse, por trigger.
- `identities` — en quién se está convirtiendo la persona (ramas del árbol).
- `habits` — nombre, ícono, color, identidad, `rrule`, ventana horaria, `two_minute_version`, señal (hora /
  después de un hábito / contexto), `anchor_habit_id`, aviso previo, `circle_habit_id` (vinculado al hábito de un
  círculo), `archived_at`.
- `habit_logs` — una fila por ocurrencia respondida (`done`, `done_minimum`, `skipped`, `missed`), única por
  (hábito, ocurrencia); `logged_at` lo pone el servidor.
- `habit_completion_counts` (vista, security_invoker) — completados de siempre por hábito.
- `coach_messages` — revisiones semanales escritas por el servidor. `coach_chat` — el chat (lectura y borrado
  propios; escribe el servidor). `coach_chat_usage` — turnos diarios del chat (solo lectura propia;
  `take_chat_slot` / `give_back_chat_slot`, solo service role).
- `entitlements` — espejo de Pro (`pro_until`, producto, tienda, `will_renew`); solo lo escribe el webhook.
- `push_tokens` (una cuenta por token de dispositivo, `register_push_token`), `push_log` (un push por
  tipo/persona/día).

**Social**
- `social_profiles` (usuario, nombre, color, foto de estadísticas), `friendships` (una fila por pareja),
  `blocks`, `reports` (de una persona o de una foto; una vez por foto y por quien reporta).
- `cheers` — 5 ánimos predefinidos, uno por remitente → destinatario cada 3 h (trigger, reloj del servidor).
- `circles` + `circle_members` (máximo 8; el dueño saca a la gente).
- `circle_habits` — un hábito activo por círculo (`photo_required`); se crea con `start_circle_habit`, que
  también vincula el hábito propio del dueño.
- `circle_habit_photos` (+ archivos en Storage) — una por persona, hábito y día; oculta para todos desde 2
  reportes y para quien reporta al instante.
- `circle_photo_doubts` (votos privados) → `circle_doubted_days` (el resultado, que se conserva aunque la foto ya no
  exista).
- Se leen con funciones SECURITY DEFINER: `social_days`, `circle_habit_members`, `circle_habit_days` (los días
  dudados no cuentan para el grupo), `circle_habit_pending_today` (para los push).

Sin uso: `garden_state` (el jardín se calcula en el teléfono sobre 120 días).

## Reglas técnicas clave
- **Las ocurrencias se calculan, no se guardan.** Los hábitos guardan una RRULE; solo las respuestas son filas.
- **Reglas de check-in** (`src/features/checkins/rules.ts`): se puede marcar hoy y días pasados, nunca el futuro;
  se aplican en `useSchedule` para que ninguna pantalla se las salte.
- **Sin conexión (básico):** los check-ins optimistas se pausan sin conexión y se reenvían incluso tras reiniciar
  (clave de mutación `TOGGLE_LOG_KEY`). Lo social exige conexión a propósito.
- **Zonas horarias en el servidor:** cada instante se convierte a la `profiles.timezone` del usuario como fecha
  «flotante» (`src/lib/time/zoned.ts`); SQL tiene `public.local_today(tz)`.
- **Recordatorios** locales (próximos 3 días, ≤ 60 notificaciones). Al sincronizarlos solo se reemplazan
  recordatorios: el aviso de fin de un enfoque (`kind: 'focus'`) se respeta.
- **IA:** el servidor arma el contexto desde la base (con el token del usuario, RLS) usando los módulos
  compartidos; Claude solo pone en palabras números que calculó el código. Opt-in con `ai_coach_enabled`; el chat
  se limita con `CHAT_DAILY_LIMIT` (20 por defecto) y se cierra a Pro con `CHAT_REQUIRES_PRO`.
- **Pro:** RevenueCat es la fuente de verdad; el webhook vuelve a leer su API en cada evento y lo copia a
  `entitlements`. `PRO_LIMITS_ENABLED` (`src/features/paywall/limits.ts`) activa los límites en la app.
- **Fotos:** se suben a la carpeta del autor y luego `save_circle_photo` las registra (la ruta la arma el servidor;
  un archivo realmente nuevo reinicia las dudas). Las URLs firmadas se guardan en memoria por versión de archivo,
  nunca en la caché persistida.
- **Publicar:** una OTA solo llega a binarios con la misma huella; los cambios de base van primero
  (`db push`, `functions deploy`) y después la OTA.
