---
name: migracion
description: Crea y aplica un cambio de esquema en Supabase (migracion nueva, push a la nube, regeneracion de tipos TypeScript) respetando RLS. Usala siempre que haya que tocar la base de datos.
---

# Cambio de esquema en Supabase

El proyecto esta enlazado al proyecto **cloud** "Habits Project". No hay stack local con Docker: no uses `npx supabase start`.

## 1. Crear la migracion

```bash
npx supabase migration new <nombre_en_ingles>
```

Crea un archivo vacio en `supabase/migrations/`. **Nunca edites una migracion ya commiteada**: esa ya esta aplicada en la nube y editarla hace que los archivos y el esquema real diverjan. Un hook de PreToolUse te lo va a recordar.

## 2. Escribir el SQL

Checklist obligatorio para cada tabla nueva:

```sql
create table public.<tabla> (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.<tabla> enable row level security;

create policy "<tabla>_select_own" on public.<tabla>
  for select using (auth.uid() = user_id);
-- idem insert / update / delete
```

- RLS activada **y** politicas por dueno. Una tabla sin politicas queda invisible o, peor, abierta.
- Fechas en `timestamptz` (UTC). El "hoy" del usuario se calcula en el cliente con su zona horaria.
- Integridad que cruza filas (por ejemplo: el habito ancla y la identidad deben ser del mismo usuario, sin ciclos de stacking) va en un **trigger**, no solo en el cliente.

Al escribir SQL largo desde la terminal, evita pelear con el escapado de comillas del shell: escribe el archivo con la herramienta de edicion y, si necesitas ejecutar algo suelto, usa `npx supabase db query -f archivo.sql`.

## 3. Aplicar y regenerar tipos

```bash
npx supabase db push
npx supabase gen types typescript --linked --schema public > src/lib/supabase/database.types.ts
```

El segundo comando es el que mantiene TypeScript sincronizado con la base real: sin el, el typecheck miente.

## 4. Verificar

Corre `/verificar` (los tipos nuevos suelen destapar errores en las queries) y prueba la ruta afectada en la app.

## Edge Functions

Son Deno, estan fuera del tsconfig y del eslint de la app. Se despliegan aparte y no necesitan Docker:

```bash
npx supabase functions deploy <nombre>
```

Los secretos (Claude API key, `sb_secret_...`) viven en los secrets de la funcion, nunca en el repo ni en `EXPO_PUBLIC_*`.
