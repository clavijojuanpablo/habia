# Guía de arte del personaje

Cómo dibujar las piezas del personaje de habia para que encajen entre sí y se lean bien en el
teléfono. Está pensada para alguien que sabe usar Illustrator pero nunca ha hecho arte para una app.
La especificación de producto está en `GAMIFICATION.md` («Your character»).

**Reparto del trabajo:** tú entregas **SVG estáticos**, uno por pieza y por estado de ánimo. El código
los combina (planta + maceta + ojos + boca + accesorio) y los anima con react-native-svg y Reanimated:
rebote, parpadeo y brillos. No hace falta Rive ni una build nueva de la app. Tú no animas nada.

---

## 1. Herramientas

| Para qué | Herramienta |
|---|---|
| Bocetos | Papel y lápiz, o el iPhone. Dibuja 10 ideas rápidas antes de abrir Illustrator. |
| Vector final | **Adobe Illustrator**. Las alternativas válidas son Figma (gratis) y Affinity Designer, con las mismas reglas. |
| Herramientas de Illustrator | **Elipse (L)** y **Rectángulo redondeado** para la base; **Curvatura (Shift+~)** para curvas (más fácil que la Pluma); **Shape Builder (Shift+M)** para unir y recortar formas; panel **Alinear**; esquinas vivas con **Selección directa (A)**. |
| Revisar | Vista a 33 % (equivale al tamaño real más pequeño) y tu iPhone (ver §8). |

No necesitas optimizadores de SVG: yo limpio los archivos al convertirlos en código.

## 2. Preparar Illustrator (una sola vez)

1. **Preferencias → Unidades → General: Píxeles.** Trazo: Píxeles.
2. Abre `art/character/_palette.svg`, selecciona todo y ve a **Muestras → Nuevo grupo de colores →
   «Ilustración seleccionada»**. Llámalo `habia`. Guarda la paleta para otros documentos con **Muestras →
   Guardar biblioteca de muestras como ASE**.
3. **Ver → Previsualización de píxeles**: actívala solo para revisar.
4. **No actives «Alinear con cuadrícula de píxeles»**: deforma las curvas, y el SVG escala sin problema.

## 3. El lienzo: 120 × 120 px

Todas las piezas se dibujan en una mesa de trabajo de **120 × 120 px en RGB**, con el origen arriba a la
izquierda (Illustrator lo hace así por defecto). Es el mismo lienzo de Brote (`src/features/mascot/brote.tsx`).

Plantillas (ábrelas en Illustrator, guarda una copia como `.ai` y dibuja encima):

- `art/character/_template-plant-pot.svg`: para **plantas** y **macetas**.
- `art/character/_template-part.svg`: para **ojos**, **bocas** y **accesorios**.

Cada plantilla trae un grupo `zones`. Selecciónalo y pulsa **Ctrl+5** para convertirlo en guías.
El grupo `reference` es la cara de Brote a escala y se borra antes de exportar.

### Zonas (plantilla planta + maceta)

```
 0 ┌──────────────────────────────────┐
 6 │ · · · · · área segura · · · · · ·│
 8 │   ┌──────── planta ──────────┐   │
   │   │       ● head (60,36)     │   │
   │   │   ┌── cara 48×32 ──┐     │   │
   │   │   │  ● face (60,66)│     │   │
   │   │   └────────────────┘     │   │
84 │---│------┌─ maceta ─┐-------│---│  ← borde de la maceta
92 │   └──────│──────────│───────┘   │  ← la planta baja hasta aquí (la maceta la tapa)
   │          │  64 × 28 │           │
112│══════════╧══════════╧═══════════│  ← línea base (el suelo)
120└──────────────────────────────────┘
```

| Zona | Coordenadas | Regla |
|---|---|---|
| Área segura | x 6–114, y 6–114 | Nada se sale de aquí (al animar se recortaría). |
| Planta | x 10–110, y 8–92 | Centrada en x = 60. La parte de abajo **llega hasta y = 92**: la maceta la tapa, así no queda un hueco. |
| Maceta | x 28–92, y 84–112 | Borde superior en **y = 84**, fondo apoyado en la **línea base y = 112**, centrada en x = 60. |
| Zona de la cara | 48 × 32 alrededor del anclaje `face` | Un área **lisa y de un solo color claro** en el cuerpo de la planta, donde caben ojos y boca. |

### Anclajes: el truco que hace que todo encaje

Un **anclaje** es un punto que le dice al código «aquí va la cara» o «aquí va el sombrero». Gracias a los
anclajes, cualquier ojo encaja en cualquier planta sin redibujar nada.

- **En cada planta**, en la capa `anchors`, deja dos círculos magenta (`#FF00FF`, radio 2):
  - `face`: el centro de la cara (entre los ojos y la boca). Por defecto está en (60, 66).
  - `head`: el punto de la parte de arriba del cuerpo donde se apoyaría un sombrero. Por defecto está en (60, 36).
  - Muévelos para que encajen en tu planta, pero **no les cambies el nombre** (en el panel Capas deben
    llamarse exactamente `face` y `head`). Yo los leo del SVG y luego los borro.
- **En ojos, bocas y accesorios** el anclaje es siempre el **centro del lienzo (60, 60)**:
  - Ojos: centros en **(51, 56)** y **(69, 56)**. Puedes variar la separación ±3 px.
  - Boca: centrada en **(60, 67)**.
  - Mejillas (opcionales, van en el archivo de los ojos): en (42, 64) y (78, 64).
  - Accesorio de cabeza: el punto donde **toca la cabeza** va en (60, 60). Puede ocupar x 30–90, y 24–72.

## 4. Estilo

Es el estilo de Brote y de la app: **pastel, redondo, plano y amable**.

1. **Sin contorno en las siluetas.** Las formas se separan por color, no por línea negra. La tinta
   (`#2E2A3B`) solo se usa para la cara.
2. **3 tonos por objeto:** base, sombra (un paso más oscuro) e iluminación (un paso más claro). La luz
   viene **de arriba a la izquierda**, así que la sombra va abajo a la derecha. Ejemplo de la paleta:
   `#3DBE7A` hoja, `#2FA56A` sombra, `#7BE3AE` brillo.
3. **Formas grandes y redondas.** Nada de puntas finas ni esquinas de 90°. Esquinas de al menos 4 px de radio.
4. **Paleta primero.** Usa los colores de `_palette.svg`. Si una pieza necesita uno nuevo (un sombrero
   azul marino, por ejemplo), adelante, pero que sea saturado y luminoso como los demás, nunca gris
   apagado.
5. **Debe verse bien en modo oscuro.** El personaje se pinta sobre tarjetas blancas (`#FFFFFF`) y,
   en modo oscuro, sobre fondo casi negro. Evita que el borde exterior de una pieza sea muy oscuro.

### Reglas técnicas (importantes: si no se cumplen, el SVG no funciona en el teléfono)

| Sí | No |
|---|---|
| Rellenos planos | Degradados, mallas, texturas |
| Trazos con extremos redondos (`round cap`, `round join`) | Pinceles, perfiles de ancho variable (si los usas: **Objeto → Expandir apariencia**) |
| Opacidad del objeto (0–100 %) | Efectos de Illustrator: sombras, desenfoque, resplandor (se convierten en imagen) |
| Formas unidas con Shape Builder o Buscatrazos | Máscaras de recorte, modos de fusión (multiplicar, etc.) |
| Texto convertido a contornos (Ctrl+Shift+O) | Imágenes incrustadas (PNG/JPG) |

Grosor de trazo mínimo: **3 px** (se verá de 1 px a tamaño pequeño). Detalle mínimo: **6 px**.

## 5. Las piezas

### Planta (el cuerpo con la cara)
- Una forma principal **grande** (cuerpo) con la zona de la cara lisa, más hojas o pelo.
- Debe reconocerse **solo por su silueta** (rellénala de negro y mira si se distingue de las demás).
- Ideas: brote (Brote), cactus, suculenta, girasol, monstera, bonsái, champiñón.

### Maceta
- Cabe en 64 × 28, con el borde en y = 84 y el fondo en y = 112.
- Lleva un **borde (labio) ancho**, de unos 6 px, que tapa la base de la planta. Debe tapar toda la franja
  y 84–92 en el ancho donde la planta toca la maceta.
- Ideas: terracota, madera, japonesa, arcoíris, espacial, gamer.

### Ojos y bocas, con estados de ánimo
Cada estilo de ojos y cada estilo de boca se dibuja en **5 ánimos**:

| Ánimo | Cuándo aparece en la app | Ojos (ejemplo) | Boca (ejemplo) |
|---|---|---|---|
| `happy` | estado normal | redondos con brillo | sonrisa suave |
| `cheer` | al marcar un hábito | redondos, más grandes | sonrisa ancha |
| `celebrate` | hito (fruto, récord) | cerrados en arco feliz `^ ^` o estrellas | boca abierta |
| `sleepy` | día de descanso | arcos cerrados hacia abajo | pequeña, relajada |
| `sad` | ayer faltó uno (**nunca culpa**: tristeza tierna, con esperanza) | cejas un poco caídas, ojos brillantes | pequeña recta o leve curva |

Los brillos, las «Zz» y el rebote **los pone el código**: no los dibujes.

### Accesorio (cabeza)
- Gorra, gafas, corona, lazo, flor, auriculares…
- Las gafas no van en la cabeza sino en la cara: en ese caso usa el anclaje de la cara. Es decir, en la
  plantilla de partes, centra los cristales sobre la línea de ojos (y = 56). Indícalo en el nombre:
  `acc-face-glasses.svg`.

## 6. Primero un lote pequeño

No dibujes todo de golpe. Entrega primero **el lote 1**, para que yo monte el sistema completo y
veamos juntos cómo se ve en el teléfono antes de que inviertas horas en el resto:

**Lote 1 (para probar el sistema):**
- 1 planta (una versión de Brote adaptada a la maceta)
- 1 maceta (terracota)
- 1 estilo de ojos × 5 ánimos
- 1 estilo de boca × 5 ánimos
- 1 accesorio (gorra)

Son 13 archivos. Si con él todo encaja, siguen las demás tandas hasta el set de lanzamiento: **6 plantas,
4 macetas, 5 ojos, 5 bocas y 6 accesorios**.

## 7. Exportar a SVG

1. Borra o oculta las capas `reference` y `zones` (y las guías no se exportan). **Deja `anchors`** en las plantas.
2. Revisa: **Objeto → Expandir apariencia** si usaste pinceles o efectos, y texto a contornos.
3. **Archivo → Exportar → Exportar como…**, formato **SVG**, marca **«Usar mesas de trabajo»**.
4. Opciones del cuadro SVG:

| Opción | Valor |
|---|---|
| Estilo | **Atributos de presentación** (no «CSS interno»: react-native-svg no lee clases CSS) |
| Fuente | Convertir en contornos |
| Imágenes | Conservar (no debería haber ninguna) |
| ID de objeto | **Nombres de capa** (así `face` y `head` llegan con su nombre) |
| Decimales | 2 |
| Minimizar | desactivado |
| Adaptable | **desactivado** (conserva el 120 × 120) |

5. Guarda también el `.ai` original en tu equipo (no hace falta subirlo).

## 8. Comprobar que se lee pequeño

El personaje se verá a **40 px** (avatar en listas de amigos) y a **120 px** (perfil).

1. **Ver → Previsualización de píxeles** con el zoom al **33 %**: eso son 40 px. ¿Se distinguen los ojos?
   ¿Se entiende el ánimo? ¿La silueta de la planta es reconocible?
2. **Prueba del entrecerrar:** aleja la cabeza de la pantalla y entrecierra los ojos. Si la cara
   desaparece, agranda los ojos o sube el contraste.
3. **Prueba en el iPhone:** envíate el PNG exportado a 40 px y míralo junto a los emojis de la app.

## 9. Nombres de archivo y carpeta

En minúsculas, con guiones, sin tildes ni espacios:

```
art/character/
  plants/      plant-brote.svg, plant-cactus.svg
  pots/        pot-terracotta.svg, pot-wood.svg
  eyes/        eyes-round-happy.svg, eyes-round-cheer.svg, eyes-round-celebrate.svg,
               eyes-round-sleepy.svg, eyes-round-sad.svg
  mouths/      mouth-smile-happy.svg … mouth-smile-sad.svg
  accessories/ acc-cap.svg, acc-face-glasses.svg
```

Patrón: `<pieza>-<estilo>[-<ánimo>].svg`. Los ánimos son `happy`, `cheer`, `celebrate`, `sleepy` y `sad`.

Copia los SVG en esas carpetas y avísame. No necesitas hacer commit.

## 10. Lista de entrega (por cada archivo)

- [ ] Mesa de trabajo de 120 × 120 px, en RGB.
- [ ] Nada fuera del área segura (6–114).
- [ ] Solo rellenos planos, trazos de al menos 3 px con extremos redondos, sin efectos, máscaras, degradados ni imágenes.
- [ ] Plantas: anclajes `face` y `head` con esos nombres exactos; la base llega a y = 92 y la cara es un área lisa de 48 × 32.
- [ ] Macetas: borde en y = 84, fondo en y = 112, centradas, y el labio tapa la base de la planta.
- [ ] Ojos y bocas: centrados en el anclaje (60, 60), y los 5 ánimos con la misma posición.
- [ ] Se entiende a 40 px (zoom 33 %).
- [ ] Capas `reference` y `zones` borradas.
- [ ] Exportado con «Atributos de presentación» e «ID de objeto: Nombres de capa».
- [ ] Nombre según §9 y guardado en su carpeta.
