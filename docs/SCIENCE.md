# Ciencia → funciones

Cada función debe apoyarse en un mecanismo de este documento. Si no se apoya en ninguno, cuestiónala.

## Las 4 leyes del cambio de comportamiento (Hábitos atómicos)

| Ley | Mecanismo | Función |
|---|---|---|
| 1. Hazlo obvio | Intenciones de implementación: «Haré [X] a las [hora] en [lugar]» (Gollwitzer, 1999; metaanálisis de Gollwitzer y Sheeran, 2006, d≈0,65) | Se arma con dos respuestas cortas: la señal («¿Cuándo lo harás?») + «¿Dónde?» (`habits.implementation_intention`); el recordatorio dice «📍 lugar» |
| | Encadenar hábitos: «Después de [hábito actual], haré [hábito nuevo]» | `cue_type = after_habit` + `anchor_habit_id`; al completar el ancla aparece el siguiente. El **detector de patrones** encuentra qué hábitos ya van juntos en tus datos y Brote sugiere encadenarlos |
| | Señales de contexto («Cuando llegue a casa → gym») | `cue_type = context` + `context_label` |
| 2. Hazlo atractivo | Identidad + normas sociales | Identidades (ramas del árbol); círculos alrededor de un hábito compartido: «únete a un grupo donde el comportamiento deseado es lo normal» (Clear, cap. 9), con racha de grupo al ≥ 50 % para que el grupo sostenga a quien flaquea |
| 3. Hazlo fácil | Regla de los 2 minutos; reducir fricción | `habits.two_minute_version`; el estado `done_minimum` cuenta para la racha. **Modo enfoque:** del «quiero leer» a empezar en un toque; el chip de 2 min es la versión mínima, y parar después de 2 minutos puede contar como mínimo |
| 4. Hazlo satisfactorio | Recompensa inmediata; registrar el hábito | Animación + vibración al marcar, el árbol crece al instante, celebraciones del día y de la identidad, registro visual |

## Hábitos basados en la identidad
«Cada acción que haces es un voto por el tipo de persona que quieres ser.» En la app se cuenta como sembrar: cada
hábito completado es una **semilla** por esa persona, la constancia la **riega** y ~66 repeticiones son la
**cosecha** (`GAMIFICATION.md`). La persona define en quién se está **convirtiendo** («Me estoy convirtiendo en… una
persona que lee») y vincula hábitos a esa identidad; completar todos los hábitos de una identidad en un día dice
«Hoy estás más cerca de convertirte en…». Matiz que cuidan los textos: una identidad describe quién eres o qué haces
(«una persona activa», «lectora»), no un resultado («más delgada»).

## Tiempo hasta la automaticidad
Lally et al. (2010): mediana de **~66 días** para la automaticidad, con un rango de **18 a 254**. Fallar un solo día
no afectó el proceso de forma significativa.
→ Un camino honesto hacia la automaticidad por hábito. Nunca prometer «21 días». Un hábito se vuelve **fruto** tras
~66 días de constancia. El coach marca la mitad, el «ya casi» y el fruto (`automaticity`).

## Nunca fallar dos veces
Un fallo es un accidente; dos son el comienzo de un hábito nuevo (malo). Evita el *efecto de violación de la
abstinencia* («ya lo arruiné, ¿para qué seguir?»).
→ Las rachas toleran un fallo; el árbol se marchita un poco y se recupera al volver. El coach sugiere la versión de
2 minutos tras un fallo (regla `never_miss_twice`) y da la bienvenida tras dos días fuera (`comeback`). La racha del
círculo usa la misma regla.

## Hora del día y energía
Los hábitos a horas constantes y anclados a rutinas estables se forman más rápido. Mostrar el % de cumplimiento por
franja (mañana / tarde / noche) para que la persona aprenda *cuándo* le va mejor.

## Coach (consejo por reglas)
Un consejo en Hoy por franja. Los detectores (`src/features/coach/detectors.ts`) leen el historial del propio
usuario y cada uno cita un mecanismo de arriba; gana el de mayor puntaje, lo mostrado en los últimos 3 días se
aparta, y cada consejo tiene un «¿Por qué?» con los datos y la fuente.

| Detector | Mecanismo |
|---|---|
| nunca fallar dos veces (+ «volviste las últimas N veces») | Nunca fallar dos veces; efecto de violación de la abstinencia |
| regreso tras dos fallos | Efecto de violación de la abstinencia |
| hora habitual, vas tarde | Las horas estables forman hábitos más rápido |
| día débil de la semana → bajar la vara | Regla de los 2 minutos (ley 3) |
| automaticidad: mitad, ya casi, fruto | Lally et al. (2010), ~66 días, rango 18–254 |
| fecha estimada del fruto según el ritmo | Lally et al.; como estimación, nunca promesa |
| hábito que cuesta → versión de 2 minutos / cuándo y dónde | Ley 3; intenciones de implementación (ley 1) |
| día cargado en la franja más débil → adelantar | Hora del día y energía |
| mejor franja | Hora del día y energía |
| semana mejor que la anterior | Mejoras pequeñas que se acumulan |
| la versión mínima salvó la racha | Regla de los 2 minutos; identidad (semillas) |
| dato de ciencia rotativo (respaldo) | — |

Cada detector calla por debajo de una muestra mínima (por ejemplo, al menos 4 veces un mismo día de la semana, 5
check-ins con hora).

## Patrones entre hábitos
El detector (`src/features/coach/patterns.ts`) compara cuánto cumples un hábito los días que hiciste otro frente a
los días que no: **el mismo día** (base para encadenar) y **el día siguiente** (un hábito que sostiene o descuida a
otro). Exige 5+ días a cada lado y 30 puntos de diferencia; el «día siguiente» solo cuenta días en que el hábito
destino se hizo el día anterior, para que las rachas buenas o malas no inventen relaciones. Se presentan siempre
como **observaciones** («en tus datos parece»), nunca como causas.

## IA: revisión semanal y chat con Brote (opt-in)
Registrar y recibir retroalimentación es una palanca central («hazlo satisfactorio»). Los números los calcula el
código (`weekly-summary.ts`, `patterns.ts`); Claude solo los pone en palabras, con reglas que reflejan este
documento: semillas / fruto (~66, rango 18–254, nunca «21 días»), nunca fallar dos veces, patrones como
observaciones, y cada sugerencia debe usar un mecanismo de arriba (versión de 2 minutos, un lugar para el hábito,
encadenar). Sin consejos médicos, psicológicos, financieros ni legales.

## Límites éticos
- Nada de recompensas de razón variable tipo tragamonedas para crear compulsión (también en el sonido).
- Nada de textos de culpa o vergüenza. Notificaciones limitadas y con respeto a las horas de silencio.
- El éxito se mide por el cambio de comportamiento de la persona, no por el tiempo que pasa en la app.
- Lo que se paga nunca se puede ganar «por la vía lenta» haciendo hábitos (efecto de sobrejustificación): las gotas
  se ganan con constancia y nunca se venden.
