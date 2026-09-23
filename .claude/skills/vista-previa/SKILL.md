---
name: vista-previa
description: Revisa visualmente una pantalla de habia sin poder iniciar sesion, usando una ruta temporal, export web y capturas en Chrome. Usala cuando un cambio sea de diseno y haga falta ver el resultado, no solo leer el codigo.
---

# Vista previa visual

**El problema:** casi todas las pantallas viven detras del login, asi que abrir la app en el navegador no basta para ver un cambio de diseno. **La solucion:** una ruta temporal que renderiza el componente con datos falsos, exportada como sitio estatico y capturada en Chrome.

## Pasos

1. **Ruta temporal.** Crea `src/app/preview.tsx` que renderice el componente (o varios estados de el) con datos inventados: habitos, logs, racha. Envuelvelo en los mismos providers que usa la app real (tema, i18n) para que los tokens y las traducciones funcionen.

2. **Exportar.**
   ```bash
   npx expo export --platform web
   ```
   Genera `dist/`. Si el componente usa Skia, comprueba que `public/canvaskit.wasm` acabe en el bundle.

3. **Servir y capturar.** Levanta un servidor estatico sobre `dist/` (script en el scratchpad, no en el repo) y abre `/preview` en Chrome con las herramientas de navegador. Captura ancho de telefono (~390 px) **y** ancho de escritorio: el mismo codigo corre en los tres targets.

4. **Revisar con ojo critico.** Los fallos que este flujo ha pillado antes en este proyecto son casi siempre de contenido, no de CSS:
   - una etiqueta sin su numero ("Record" sin el valor),
   - una barra de progreso que no concuerda con su texto ("Dia 18 de 30" con la barra al 25 %),
   - un titulo duplicado ("Hora" en la seccion y en el campo),
   - una pista obsoleta ("HH:MM" cuando ya hay selector),
   - filas vacias demasiado altas que hacen scroll inutil.
   Comprueba tambien **modo claro y oscuro**.

5. **Limpiar SIEMPRE.** Borra `src/app/preview.tsx` y `dist/` antes de commitear. Una ruta de preview olvidada se publica con la app.

## Cuando NO usar esto

Si el cambio es de logica, no de pixeles, sale mas barato un test. Este flujo cuesta varios minutos; usalo cuando la pregunta sea "como se ve", no "que hace".
