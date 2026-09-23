---
name: cerrar-sesion
description: Cierra una sesion de trabajo en habia dejando el proyecto listo para la siguiente: verifica, revisa, actualiza docs/STATUS.md y ROADMAP.md, y commitea. Usala al terminar un bloque de trabajo.
---

# Cerrar sesion

El objetivo es que la proxima sesion (o la proxima persona) sepa en un minuto donde estamos sin leer todo el codigo.

## 1. Verificar

Corre `/verificar`. Si hay rojo, se arregla antes de seguir. No se documenta ni se commitea trabajo roto.

## 2. Revisar (opcional segun tamano)

Si el bloque fue mas que un retoque, lanza el agente `revisor` sobre `git diff HEAD`. Atiende lo bloqueante e importante; lo menor puede quedar anotado en STATUS.md como deuda.

## 3. Actualizar el estado

**`docs/STATUS.md`** es el punto de entrada de cada sesion (un hook lo inyecta al arrancar). Actualiza:
- **Ahora mismo**: que se acaba de terminar, en dos o tres frases.
- **Proximos pasos**: el primero debe ser accionable de inmediato ("empieza aqui").
- **Deudas conocidas**: lo que quedo a medias, con el archivo donde vive.
- La fecha de la cabecera.

**`docs/ROADMAP.md`** es el backlog largo: mueve los items a ✅ / 🚧 / ⏳ segun corresponda. STATUS es el "hoy"; ROADMAP es el "todo el camino". No dupliques: STATUS resume y apunta.

Si el cambio afecta a que datos se guardan o como, actualiza tambien `src/features/legal/content.ts` (privacidad y terminos deben seguir siendo verdad) y `docs/ARCHITECTURE.md`.

## 4. Commitear

Mensaje en ingles, imperativo, una linea que explique el **efecto** del cambio, no los archivos tocados:

```
Lock future check-ins and polish the week view
```

Antes de commitear, mira `git status` y confirma que no entra nada que no deba: `.env`, `dist/`, rutas de preview, capturas sueltas.

## 5. Decir donde quedamos

Cierra el turno con: que se hizo, que se verifico (con numeros reales) y cual es el siguiente paso concreto.
