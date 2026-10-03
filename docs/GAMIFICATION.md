# Gamificación: el árbol de identidad

Cada hábito completado es una **semilla** sembrada por la persona que quieres ser. Las semillas alimentan un árbol
vivo dibujado con Skia.

**La metáfora de sembrar** (en todos los textos; el código aún dice `votes`):
- **Sembrar (🌱 semillas):** cada hábito completado. El contador de la barra superior, el jardín y Progreso.
- **Regar (💧 gotas):** se ganan con constancia; la moneda del personaje (abajo).
- **Cosechar (🍎 frutos):** un hábito que llegó a ~66 repeticiones.

## Anatomía
| Parte del árbol | Significado |
|---|---|
| Tronco | La constancia total |
| Ramas | Identidades (en quién te estás convirtiendo) → `identities` |
| Hojas | Hábitos activos en esa rama |
| Flores | Semanas constantes (≥80 % de lo programado) |
| Frutos | Hábitos que llegaron a la automaticidad (~66) |
| Raíces | Cadenas de hábitos (`anchor_habit_id`), visibles bajo tierra |

## Etapas
0 Semilla → 1 Brote → 2 Arbolito → 3 Árbol → 4 Árbol con frutos (umbrales de 0 / 5 / 25 / 75 / 200 semillas). En el
Jardín, una barra delgada bajo el dibujo muestra la etapa, las semillas y cuántas faltan para la siguiente.

## Salud
- Un fallo inclina un poco las hojas («nunca fallar dos veces»); se recupera del todo con el siguiente hábito.
- Varios fallos hacen que pierda hojas, pero **nunca muere**. El progreso nunca se borra, solo se pausa.

## Ambiente
- El cielo sigue la hora real y las franjas del usuario: amanecer cálido, tarde dorada, noche azul con estrellas.
- Nubes cuando hay hábitos pendientes; los descansos a propósito nunca traen nubes.

## El Jardín como espacio de identidad
«¿Quién te estás volviendo?»: una tarjeta por rama con las semillas de la semana y sus hábitos, y un botón
**+ Nueva identidad** que permite elegir qué hábitos existentes la hacen crecer. Completar todos los hábitos de una
identidad en un día (≥2) muestra su propia celebración, distinta del confeti del día. El Jardín también recibe a
Brote: las revisiones semanales y la entrada al chat.

## Tu personaje (decidido 2026-09-29; el arte está en curso)
Cada persona tiene un **personaje planta personalizable** que es *ella* creciendo: el principio de identidad hecho
visible. Es su foto de perfil (lo que ven sus amigos y sus círculos) y debe leerse bien a ~40 px.

| Pieza | Ejemplos |
|---|---|
| Planta | brote, cactus, girasol, tulipán, árbol, hongo, palmera… |
| Maceta | terracota, madera, japonesa, arcoíris, espacial, gamer… |
| Ojos | varios estilos, cada uno con los ánimos de abajo |
| Boca | varios estilos, cada uno con los ánimos de abajo |
| Accesorio | gorra, gafas, corona, moño… |

- **Puntos de anclaje, no posiciones fijas:** cada planta declara un ancla `face` y una `head`; las macetas
  comparten la línea del borde (y 84) y la base (y 112). Así cualquier pieza encaja en cualquier planta.
- **Empezar pequeño y crecer por temporadas:** ~6 plantas, 4 macetas, 5 ojos, 5 bocas y 6 accesorios al lanzar
  (miles de combinaciones); las piezas son SVG, así que las nuevas temporadas podrían llegar sin actualizar la app.
- **Ánimos mínimos:** feliz, ánimo, celebra, dormido (día de descanso), triste-pero-amable (falló ayer — nunca
  avergüenza).
- **Se anima en código** (react-native-svg + Reanimated), no con Rive. Guía de arte paso a paso: `CHARACTER-ART.md`
  (archivos fuente en `art/character/`, fuera de `assets/` para no mover la huella).
- **Desbloqueos:** gratis, ganados con **💧 gotas** o comprados. Las gotas se ganan con **constancia, nunca con
  check-ins sueltos** (metas de racha, semanas constantes, los ~66), con tope diario, y **nunca se venden**. Las
  calcula el servidor (un libro de movimientos que escribe Postgres), nunca el cliente.

## Cosméticos (Pro)
Temas del jardín y piezas del personaje. **Solo cosméticos, nunca pagar para ganar**; sin cajas sorpresa ni escasez
falsa («¡solo hoy!»). Algunos cosméticos se ganan con hitos, así que quien no paga también personaliza.

## Círculos (decidido 2026-10-02)
Un círculo (máximo 8 personas) **es** un hábito compartido: se crea junto con su hábito y un solo ícono, y quien lo
crea entra automáticamente. Cada miembro pone su propia hora y recordatorio.
- **Racha del grupo:** el día cuenta cuando al menos la mitad de quienes participan y no descansan lo hizo (todos en
  un círculo de dos), con la regla de nunca fallar dos veces. La pantalla del círculo pone la racha como
  protagonista, luego «Hoy» (3/8 que pasa de rojo a amarillo y a verde) y un ranking de constancia (esta semana /
  30 días / general). Nunca se señala a quién faltó.
- **Fotos** (si el círculo las pide): solo cámara, se borran a los 7 días. **«¿Cuenta?»:** votos privados; una
  mayoría estricta de los demás quita ese día solo de la racha del grupo. Los reportes ocultan la foto para quien
  reporta y para todos desde 2 reportes.
- **Ánimos:** 5 predefinidos (nada que moderar), uno por amigo cada 3 h. Push sociales con un interruptor.
- Requisito de App Store para contenido de usuarios (guía 1.2): bloquear, reportar, moderar, borrar la cuenta.

## Recompensas
- Inmediatas: animación al marcar, vibración, el árbol crece, el personaje reacciona (y, con la build de sonido,
  un sonido corto — ver ROADMAP).
- Hitos: rama nueva, primera flor, primer fruto, metas de racha, etapas del árbol.
- Sin cajas sorpresa ni ciclos de compulsión aleatorios (ver `SCIENCE.md`, límites éticos).
