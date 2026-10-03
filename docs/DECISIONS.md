# DECISIONES

Por qué habia es como es. Una entrada por decisión: fecha, qué se decidió, por qué y qué se descartó. Léelo antes
de reabrir una pregunta, y agrega una entrada cada vez que se tome una decisión de producto o técnica. Dentro de cada
sección, lo más nuevo primero.

---

## Producto

**2026-10-02 · Pro = «Brote te conoce» + «Hazlo tuyo».**
Pro profundiza, nunca quita: la app gratis debe bastar para formar hábitos. Pro = revisión semanal con IA, chat con
Brote basado en los patrones del usuario, informe del mes, más cosméticos (temas del jardín, piezas del personaje) y
hábitos ilimitados. Lo que cuesta dinero por usuario (Claude) es Pro; lo que es solo código en el teléfono puede ser
gratis.
*Descartado:* «insights» como tercer pilar — casi todo ya existe como consejos gratis del coach; venderlo sería
cobrar por lo que ya se regala.

**2026-10-02 · Se descartan «Caminos» (programas guiados).**
Mucho contenido (20–30 lecciones por camino en dos idiomas), prescriptivo y una sección nueva en una app que debe ser
sencilla. Su corazón sobrevive como el consejo gratis **«subir de nivel»**.

**2026-10-02 · El modo enfoque es gratis.**
Baja la fricción (ley 3) y da un motivo diario para abrir la app. Los sonidos ambiente podrían ser Pro más adelante.

**2026-10-02 · Precios:** US$4.99/mes · US$34.99/año, 7 días gratis solo en el plan anual. Precios fijados desde el
precio de EE. UU. en App Store Connect; Latinoamérica se ajusta a mano si la conversión lo pide.

**2026-10-02 · Los límites de Pro siguen APAGADOS hasta el lanzamiento.**
La infraestructura sale ya (pantalla de pago, entitlements, webhook); la pantalla de pago dice claramente que por
ahora todo es gratis y que suscribirse es apoyar. Cobrar por lo que los testers ya tienen sería engañoso (App Review
2.3 / 3.1.2).

**2026-10-02 · Se descarta Pro Parejas.** Las parejas son círculos de dos, y los círculos siguen gratis: traen gente.

**2026-10-02 · Un círculo ES su hábito.**
Un hábito por círculo, definido al crear el círculo, con un solo ícono (el del círculo); el creador queda vinculado
automáticamente (`start_circle_habit`). Otro hábito = otro círculo.

**2026-10-02 · «¿Cuenta?» en lugar de que el dueño oculte fotos o de expulsar.**
Los miembros votan en privado que una foto no muestra el hábito; una mayoría estricta de los demás participantes
quita ese día de la racha **del grupo** — el check-in, la racha y las semillas del autor no se tocan. El autor puede
subir otra foto ese día (se reinician los votos). Sin expulsión automática (en grupos pequeños se presta al acoso y
contradice «perdonar»); sacar a alguien sigue siendo decisión manual del dueño. Los reportes (contenido inapropiado)
son otro canal: se oculta para quien reporta al instante y para todos desde 2 reportes, hasta revisarla.

**2026-10-02 · Ánimos: uno por amigo cada 3 horas, de cualquier tipo.** Hasta 5 por amigo al día era spam.

**2026-10-02 · Se descartan las ligas.**
Los rankings con desconocidos no motivan: no puedes influir en ellos y no te importan. Esa energía va a los
círculos. (Idea original: ligas semanales de ~30 personas por % de constancia, opcionales.)

**2026-10-02 · Se descartan las rachas 1:1 con amigos (1.4.0).** Una racha compartida sobre «cualquier hábito,
cualquier día» no medía nada en común. Una racha con un amigo es un círculo de dos alrededor de un hábito.

**2026-10-02 · Fotos solo con cámara y borradas a los 7 días.** Prueba de hoy, no un archivo; menos que guardar y
moderar.

**2026-10-01 · La identidad como «convertirse».** «Me estoy convirtiendo en…» en lugar de «Soy una persona que…»: el
cambio de identidad es una dirección, no una afirmación.

**2026-10-01 · Amigos y círculos reemplazan a «Parejas».** Una pareja es un círculo de dos; la base general sirve a
más gente.

**2026-09-30 · La metáfora de sembrar reemplaza a «votos» en todos los textos.** Sembrar (completar) → regar
(constancia) → cosechar (~66 repeticiones). El código sigue diciendo `votes`.

**2026-09-29 · Personaje = un avatar planta de cinco piezas intercambiables** (planta, maceta, ojos, boca,
accesorio), que es la foto de perfil; las gotas se ganan con constancia, nunca se venden.

**2026-09-29 · Orden después de TestFlight:** coach con IA → personaje → amigos y círculos → monetización, todo
antes del lanzamiento público.

**Alcance (vigente):** no es una app de notas, listas ni calendario — integrar (leer el calendario) en lugar de
reinventar. Las tareas sueltas quedan fuera de los hábitos para que las rachas y el árbol sigan midiendo repetición.

## Diseño

**2026-10-02 · Pantallas tranquilas.** Menos palabras, más aire: las explicaciones detrás de un toque (ⓘ) en vez de
párrafos; lo secundario (enlaces legales) más abajo en la jerarquía; la racha del grupo es la protagonista del
círculo; filas compactas en Ajustes con solo íconos (☀️ 🌙, 🇪🇸 🇬🇧). Cada rediseño se revisa en una vista previa
visual antes de publicarlo.

**2026-10-02 · Solo claro / oscuro en el selector.** Se quitó «Sistema» de la interfaz; los perfiles que lo tenían
siguen al teléfono.

**2026-10-01 · El personaje se anima en código, no con Rive.** El artista entrega SVG estáticos;
react-native-svg + Reanimated los componen y animan (sin build de desarrollo; cualquier combinación de piezas
funciona).

**Descartado:** la gráfica de la «curva del 1 %» (difícil de leer); el campo de temptation bundling (fricción, nadie
lo usaba — la columna se queda).

## Técnica

**2026-10-02 · El servidor arma el contexto de la IA.** `weekly-review` y `coach-chat` leen los datos del usuario con
su propio token (RLS) y calculan los números con los módulos compartidos de la app; la app solo envía la pregunta.
Claude explica números, nunca cuenta ni ve datos que el cliente pudiera falsear.

**2026-10-02 · Límites de costo que el usuario no puede tocar.** El límite diario del chat vive en
`coach_chat_usage` (solo escribe el service role); el turno se reserva de forma atómica antes de llamar a Claude y
se devuelve si falla. Borrar el chat nunca lo reinicia.

**2026-10-02 · Modelos:** Haiku 4.5 para el chat (rápido, barato), Sonnet 5.5 para las revisiones semanales; ambos
con la beta de fallback del servidor. Se pueden cambiar con secretos (`CHAT_MODEL`, `COACH_MODEL`).

**2026-10-02 · Los patrones «día siguiente» controlan las rachas.** Un vínculo al día siguiente solo cuenta los días
después de que el hábito destino se hizo, para que las semanas buenas o malas (todo sube o baja junto) no pasen por
un hábito que arrastra a otro.

**2026-10-02 · RevenueCat es la fuente de verdad de Pro;** `entitlements` es un espejo que escribe un webhook que
vuelve a leer la API de RevenueCat en cada evento (resistente al orden, idempotente). `usePro()` = la tienda en este
teléfono O el espejo.

**2026-10-02 · Todo lo nativo junto en la build 5** (cámara, edición de imagen, SDK de RevenueCat con su paquete de
UI) para que casi todo lo posterior salga por OTA.

**2026-10-02 · Subida de fotos en dos pasos con cola en el teléfono.** El check-in nunca espera a la foto; la subida
se reintenta hasta llegar al servidor; los errores permanentes descartan la foto, nunca el check-in.

**2026-09-30 · OTA por huella.** Política de `runtimeVersion` `fingerprint`: una actualización nunca le llega a un
binario incompatible. El trabajo que toca lo nativo va en una rama hasta que su build esté en los teléfonos.

**2026-09-30 · Las ocurrencias se calculan, no se guardan.** Los hábitos guardan una RRULE; solo las respuestas
(registros) son filas.

**Reglas vigentes:** RLS en todas las tablas con políticas de dueño; secretos solo en los secretos de Edge Functions /
EAS env; helpers SECURITY DEFINER en el esquema `private` (que la API no expone); una migración aplicada no se edita;
la lógica pura vive en módulos con tests, compartidos con Deno por `scripts/sync-shared.js`.
