# Marca

## Nombre: **habia** (decidido 2026-09-23)
Nombre de la app, slug y esquema de enlaces (`habia://`), repositorio `clavijojuanpablo/habia`, dominio
**habia.app**. Se lee como «había» y contiene *habi*t: corto, propio y en español primero. Pendiente: registro de
marca.

Candidatos descartados: Brote, Raíz, Voto, Semilla, Hábitat. «Brote» vive como la mascota.

## Voz
- La metáfora de sembrar en todo: **siembras** semillas (hábitos completados), las **riegas** con constancia y
  **cosechas** frutos (hábitos automáticos). Nunca «votos» en los textos.
- Cálida, alentadora, nunca culpabiliza. Frases cortas. Habla de identidad («te estás convirtiendo en…»), no de
  obligaciones. Trata de «tú».
- **Menos es más:** si algo se entiende solo, no lleva texto; las explicaciones van detrás de un toque (ⓘ).

## Mascota
**Brote** 🌱 — un brote dibujado en SVG (`src/features/mascot/brote.tsx`) con 4 ánimos: feliz, ánimo, celebra,
dormido. Presenta el onboarding, celebra, da los consejos, escribe la revisión semanal y conversa en el chat. Es el
principal activo de marketing hasta que exista el personaje de cada persona.

## Imágenes de la app
Todas salen de un solo SVG con `npm run icons` (`scripts/generate-icons.mjs`): Brote crema sobre degradado verde
para el ícono y el favicon, primer plano transparente + silueta blanca para los íconos adaptativos de Android, y
Brote verde sobre crema (oscuro: ciruela) para la pantalla de inicio.

## Dirección visual (implementada)
- **Ánimo:** amigable, juguetón y motivador (referencias: la navegación y las rachas de Duolingo, apps pastel de
  salud y educación).
- **Claro por defecto:** fondo crema cálido (#FFF8F1) con tarjetas blancas redondeadas y sombras suaves. Oscuro:
  gris ciruela profundo (#16141D) con tarjetas elevadas.
- **Paleta:** verde menta (#3DBE7A), naranja de racha (#FF9F43), dorado de Pro y semillas, lavanda para lo social y
  Brote. Franjas: mañana durazno, tarde mantequilla, noche lavanda, «cualquier hora» menta.
- **Tipografía:** Nunito (redondeada) — Black para números grandes, ExtraBold para títulos.
- **Navegación:** barra superior estilo Duolingo (🔥 racha · 🫂 círculos · 🌱 semillas) y barra inferior amplia con
  íconos emoji.
- **Componentes:** botones 3D gruesos, filas táctiles de 52 px, anillos de progreso, números protagonistas.
- Los tokens viven en `src/constants/theme.ts`; las rampas del mapa de calor están validadas en contraste para ambos
  modos.

## Sonido (dirección, aún no implementado)
Una familia pequeña y orgánica — madera, agua, campanitas suaves — que suena a jardín, no a casino: cortos (<1,5 s),
amables, nunca castigan un fallo y respetan el modo silencio. Detalle por momento en `ROADMAP.md` → *Diseño de
sonido*.
