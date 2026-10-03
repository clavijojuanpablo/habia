# ROADMAP

De dónde viene habia, qué sigue y todas las ideas que vale la pena guardar. Estados: ✅ hecho · 🚧 en curso ·
⏳ siguiente · 💡 idea (sin decidir). Por qué se eligió o se descartó algo: `DECISIONS.md`. Qué salió y cuándo:
`RELEASES.md`. El estado de hoy: `STATUS.md`.

Etiquetas: **[Gratis]** / **[Pro]** · esfuerzo **S / M / L** · **OTA** (solo JavaScript) o **Build** (necesita un
binario nativo nuevo) · **Servidor** (migración o Edge Function).

---

## Hecho (resumen)

| Área | Qué existe |
| --- | --- |
| Núcleo | Cuenta (correo/contraseña, recuperar, enlaces de correo como Universal Link, borrar cuenta), onboarding de 5 pasos, hábitos con recurrencia RRULE, versión de 2 minutos, encadenamiento, señales, identidades; Hoy / Semana; reglas de check-in; cola sin conexión; recordatorios locales |
| Visual | Sistema de diseño pastel (claro/oscuro), mascota Brote, árbol de identidad en Skia con cielo vivo, celebraciones (día, identidad), Progreso (tarjetas, calendario, destacados, gráficas), el Jardín como espacio de identidad |
| Coach | 12 detectores por reglas (un consejo por franja, «¿Por qué?»), revisión semanal con IA (Claude, opt-in), **chat con Brote** (contexto armado en el servidor, límite diario), **detector de patrones** (mismo día / día siguiente) |
| Enfoque | **Modo enfoque**: temporizador por hábito, chip de 2 min = versión mínima, siembra el hábito al terminar |
| Social | Usuarios, amigos, ánimos (uno por amigo cada 3 h), círculos = un hábito compartido con racha de grupo al ≥ 50 %, fotos con cámara (7 días), votos «¿Cuenta?», reportes, bloqueo, push sociales |
| Pro | RevenueCat (iOS), pantalla de pago, espejo `entitlements`, interruptor de límites (apagado) |
| Plataforma | TestFlight (build 1.6.0 (5)), EAS Update por huella, Sentry + PostHog, habia.app (Astro), correos con marca, textos legales es/en |

---

## Ahora

- ⏳ Unir `build-4` → `main`; testers a la build 5.
- ⏳ Cuenta de prueba sembrada para ver el detector de patrones funcionando en el chat.
- ⏳ Tareas de App Store (dueño, próxima semana): captura real de la pantalla de pago en las dos suscripciones,
  App Privacy, volver a publicar la web.

## Siguiente

| Qué | Etiquetas | Notas |
| --- | --- | --- |
| **«Subir de nivel»** — Brote sugiere crecer un hábito que lleva ~2 semanas firme (1 página → 5 páginas) | Gratis · S · OTA | La regla de los 2 minutos llevada hacia adelante; un detector nuevo + editar el hábito en un toque |
| **Informe del mes** — tarjeta para compartir: días sembrados, hábito estrella, el mejor patrón, escrita por Brote | Pro · M · OTA + Servidor | Reutiliza el resumen semanal y los patrones |
| **Activar los límites de Pro** — 5 hábitos (trigger en la base que lea `entitlements`), chat (`CHAT_REQUIRES_PRO=true`), candado a la revisión semanal | — · M · OTA + Servidor | Solo cuando Pro tenga valor propio; la nota «todo es gratis» se oculta sola |
| **Personaje, lote 1** — componer las piezas SVG del dueño, editor del personaje, el personaje como foto de perfil | Gratis (+ piezas Pro) · L · OTA + Servidor | Necesita el arte; el libro de gotas lo escribe Postgres |
| **Patrones como consejo gratis** — «después de meditar, lee» cuando el detector encuentra un vínculo fuerte | Gratis · S · OTA | Sugerencia de encadenar; el chat ya usa los patrones |

## Siguiente build nativa (juntarlas: cada build cuesta tiempo y revisión)

| Qué | Etiquetas | Notas |
| --- | --- | --- |
| **Diseño de sonido** (ver backlog) | Gratis (+ ambientes Pro) · M · Build | Necesita `expo-audio` (no está en la build 5) |
| **Apple Health** — hábitos que se marcan solos (pasos, sueño, entrenamientos) | Pro · L · Build | Probablemente la función Pro más fuerte: cero fricción |
| **Widgets** (pantalla de inicio y bloqueo) | Gratis · M · Build | «Hazlo obvio» |
| **Live Activity del modo enfoque** — el contador en la pantalla bloqueada | Gratis · M · Build | |
| **Iniciar sesión con Apple y Google** | — · M · Build | Agregar Google obliga a agregar Apple (guía 4.8) |
| Guardar la sesión de enfoque aunque iOS cierre la app | Gratis · S · OTA | Guardar `{habitId, at, endsAt}` y sembrar al volver |

## Lanzamiento (fase 6)

- ⏳ Ficha de App Store: capturas, descripción, palabras clave (ASO); enviar la versión **junto con** el grupo de
  suscripciones.
- ⏳ Landing: lista de espera, capturas reales; enlace público de TestFlight.
- ⏳ Revisión legal (jurisdicción, abogado); analítica opt-in para la UE.
- ⏳ Android: pruebas internas en Play (necesita un dispositivo y el periodo de pruebas cerradas), Play Billing.
- ⏳ Pagos en la web: confirmar si Stripe acepta a una persona natural en Colombia (si no, Paddle / Lemon Squeezy /
  una LLC en EE. UU.).

---

## Backlog de ideas

### 🔊 Diseño de sonido — Gratis (ambientes Pro), necesita build (`expo-audio`)
Una familia de sonidos pequeña y reconocible, cálida y orgánica (madera, agua, campanitas suaves), nunca de
tragamonedas.
- **Check-in:** un «pop de semilla en la tierra» por hábito; un clic más suave para la versión mínima; un sonido
  discreto al deshacer.
- **Día completo:** una melodía corta y alegre con el confeti. **Identidad completa:** una variación en la tonalidad
  propia de esa rama.
- **Hitos:** metas de racha, el primer fruto (~66), una etapa nueva del árbol — cada uno con su motivo corto.
- **Modo enfoque:** una campanita suave al empezar, un tic opcional en el último minuto y una campana al terminar
  (también como sonido de la notificación); **ambientes** mientras te enfocas — lluvia, bosque, café, ruido blanco
  [Pro].
- **Brote:** pequeños sonidos tipo voz cuando aparece, celebra o responde en el chat (estilo Animal Crossing, sin
  palabras).
- **Social:** un sonido discreto y propio al recibir un ánimo; un «ding» de grupo cuando el día del círculo queda
  salvado.
- **Reglas:** respeta el interruptor de silencio; un ajuste «Sonidos» (activado por defecto) + volumen; la vibración
  se queda; cada sonido dura menos de ~1,5 s salvo los ambientes; nunca es la única señal (accesibilidad); ningún
  sonido para un fallo.
- **Origen:** encargar o licenciar (revisar el uso comercial); archivos pequeños (AAC), cargados cuando hacen falta.

### Coach e IA
- 💡 Brote **avisa por push** cuando un patrón está por romperse («hoy no meditaste; mañana sueles fallar el gym»)
  [Pro · M · Servidor] — necesita un cron de envíos y horas de silencio.
- 💡 **Plan de rescate** tras dos fallos: una versión más pequeña para volver, en un toque [Gratis · S · OTA].
- 💡 👍 / 👎 en los consejos para afinar los detectores [Gratis · S · OTA].
- 💡 Revisión semanal con la **Batch API** desde un cron (50 % más barata, lista el lunes) [Servidor · M].
- 💡 Ánimo + diario corto con correlaciones («los días que meditas, tu ánimo es 30 % mejor») [Pro · L].
- 💡 «Tu año en hábitos» (resumen anual estilo Wrapped) [Gratis para compartir + detalle Pro · M].
- 💡 Micro-lecciones: 1 minuto de ciencia de hábitos en contexto, no como curso [Gratis · M].

### Hábitos y Hoy
- 💡 **Escudo de racha** que se gana: 7 días constantes dan un día protegido [Gratis · S].
- 💡 **Calendario de solo lectura** en Hoy / Semana como contexto [Gratis · M · Build].
- 💡 Recordatorios sueltos, separados de los hábitos (solo si los testers lo piden) [Gratis · M].
- 💡 Atajos de Siri, Apple Watch [L · Build].
- 💡 Horas de silencio para todas las notificaciones [Gratis · S].

### Jardín y personaje
- 💡 Temas del jardín (estaciones, cielo nocturno, jardín japonés) [Pro · M].
- 💡 El personaje crece por etapas con la constancia [L — multiplica el arte].
- 💡 💧 gotas (ganadas con constancia, nunca vendidas) para desbloquear piezas [Gratis · M · Servidor].
- 💡 Árboles entrelazados para círculos de dos [Gratis · L].
- 💡 Momento de cosecha 🌱 → 🌸 → 🍎 cuando un hábito llega a ~66 [Gratis · S].

### Social y crecimiento
- 💡 Tarjetas para compartir: «Mi árbol a los 66 días», metas de racha, informe del mes [Gratis · M].
- 💡 Referidos: invita a un amigo y ambos reciben una semana de Pro [Pro · M · Servidor].
- 💡 Tiempo real en la pantalla del círculo mientras está abierta [Gratis · S].
- 💡 Temporadas de círculo: un reto de 30 días dentro del círculo [Gratis · M].
- 💡 Plan familiar, suscripciones de regalo, programas de bienestar B2B [más adelante].

### Plataforma y calidad
- 💡 Agregados del jardín como RPC de Postgres cuando crezcan los registros (`garden_state` hoy no se usa).
- 💡 Pasada de accesibilidad: Dynamic Type, etiquetas de VoiceOver en todas las gráficas.
- 💡 Una vista de costos de la IA (tokens por usuario por mes) antes de lanzar Pro.
- 💡 Más idiomas después de es/en (pt-BR primero: Latinoamérica).

---

## Descartado (detalles en `DECISIONS.md`)
Ligas con desconocidos · rachas 1:1 con amigos · «Caminos» (programas guiados) · Pro Parejas · que el dueño oculte
fotos · expulsión automática de círculos · Rive para el personaje · la gráfica de la «curva del 1 %» · el campo de
temptation bundling.
