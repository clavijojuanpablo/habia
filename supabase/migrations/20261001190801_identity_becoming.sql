-- Identity is now "who I am becoming" (1.2.0): the form asks "Me estoy convirtiendo en…" and the
-- app says "Hoy estás más cerca de convertirte en <statement>". identities.statement therefore
-- holds the person you become ("una persona que cuida su cuerpo"), no longer a sentence.
--
-- Existing rows came in two shapes under the old "Soy una persona que…" label: the full sentence
-- (onboarding suggestions) or only its ending ("Cuida su cuerpo"). Normalize both, in the
-- owner's language, so the new phrasing reads right.

create function pg_temp.lower_first(value text) returns text
language sql immutable as $$
  select lower(left(btrim(value), 1)) || substr(btrim(value), 2);
$$;

create function pg_temp.becoming(statement text, locale text) returns text
language sql immutable as $$
  select pg_temp.lower_first(case
    -- "Soy una persona que…", "Soy alguien que…", "Soy lectora" → drop "Soy".
    when statement ~* '^\s*soy\s+' then regexp_replace(statement, '^\s*soy\s+', '', 'i')
    -- "I am a person who…", "I'm someone who…" → drop "I am".
    when statement ~* '^\s*(i am|i''m)\s+' then regexp_replace(statement, '^\s*(i am|i''m)\s+', '', 'i')
    -- Already a person: "una persona…", "alguien que…", "a reader".
    when statement ~* '^\s*(una|un|alguien|a|an|someone|the)\s+' then btrim(statement)
    -- Only the ending of the old sentence: give it back its subject.
    else (case when locale = 'en' then 'someone who ' else 'una persona que ' end)
         || pg_temp.lower_first(statement)
  end);
$$;

update public.identities i
set statement = pg_temp.becoming(i.statement, coalesce(p.locale, 'es'))
from public.profiles p
where p.id = i.user_id;
