/**
 * Website copy, Spanish first. Kept apart from the app's i18n: the site says
 * different things. Every claim must be true of the app as it ships today.
 */
export type Lang = 'es' | 'en';

export const CONTACT_EMAIL = 'hola@habia.app';

/** Paths per language, so each page can link to its translation. */
export const ROUTES = {
  home: { es: '/', en: '/en' },
  privacy: { es: '/privacidad', en: '/en/privacy' },
  terms: { es: '/terminos', en: '/en/terms' },
} as const;

export type RouteKey = keyof typeof ROUTES;

export const copy = {
  es: {
    meta: {
      title: 'habia · Hábitos que se quedan',
      description:
        'Un tracker de hábitos visual y amable, basado en la ciencia. Cada acción es un voto por la persona que quieres ser.',
    },
    nav: { switchLang: 'English', switchLangLabel: 'Ver en inglés' },
    hero: {
      badge: 'Muy pronto en iPhone y Android',
      title: 'Cada acción es un voto por la persona que quieres ser.',
      body: 'habia es un tracker de hábitos visual y amable, basado en la ciencia de cómo se forman los hábitos. Marca tus pequeñas victorias, mira crecer tu árbol y conviértete en quien quieres ser.',
      cta: 'Avísame cuando salga',
      ctaSubject: 'Quiero probar habia',
    },
    preview: {
      label: 'Así se ve tu día en habia',
      today: 'Hoy',
      bands: [
        { band: 'morning', emoji: '🌅', name: 'Mañana', habit: '🧘 Meditar 5 minutos', done: true },
        { band: 'afternoon', emoji: '☀️', name: 'Tarde', habit: '📖 Leer 10 páginas', done: true },
        { band: 'night', emoji: '🌙', name: 'Noche', habit: '👕 Dejar lista la ropa', done: false },
      ],
    },
    features: {
      title: 'Hecha para que los hábitos se queden',
      items: [
        {
          emoji: '🌅',
          title: 'Tu día por franjas',
          body: 'Mañana, tarde y noche, cada una con su color. Ves de un vistazo qué te toca ahora.',
        },
        {
          emoji: '🌳',
          title: 'Tu árbol de identidad',
          body: 'Cada hábito cumplido es un voto. Tus votos hacen crecer un árbol que muestra en quién te estás convirtiendo.',
        },
        {
          emoji: '🌱',
          title: 'La versión de 2 minutos',
          body: '¿Día difícil? Haz la versión mínima. Mantener vivo el hábito vale más que hacerlo perfecto.',
        },
        {
          emoji: '🤗',
          title: 'Nunca falles dos veces',
          body: 'Un día perdido no borra tu progreso. Y si necesitas descansar, lo marcas a propósito: no cuenta como fallo.',
        },
      ],
    },
    science: {
      title: 'Ciencia, no trucos',
      body: 'habia se basa en Hábitos Atómicos y en la investigación sobre cómo se forman los hábitos: empezar pequeño, decidir cuándo y dónde, encadenar un hábito con otro. Sin promesas mágicas: un hábito tarda en promedio unos 66 días en volverse automático, no 21.',
    },
    footer: { privacy: 'Privacidad', terms: 'Términos', contact: 'Contacto', rights: 'Hecho con cariño en Colombia.' },
    legal: { updated: 'Última actualización', back: 'Volver al inicio' },
  },
  en: {
    meta: {
      title: 'habia · Habits that stick',
      description:
        'A visual, kind habit tracker grounded in science. Every action is a vote for the person you want to become.',
    },
    nav: { switchLang: 'Español', switchLangLabel: 'Ver en español' },
    hero: {
      badge: 'Coming soon to iPhone and Android',
      title: 'Every action is a vote for the person you want to become.',
      body: 'habia is a visual, kind habit tracker grounded in the science of how habits form. Check off your small wins, watch your tree grow and become who you want to be.',
      cta: 'Tell me when it launches',
      ctaSubject: 'I want to try habia',
    },
    preview: {
      label: 'Your day in habia',
      today: 'Today',
      bands: [
        { band: 'morning', emoji: '🌅', name: 'Morning', habit: '🧘 Meditate 5 minutes', done: true },
        { band: 'afternoon', emoji: '☀️', name: 'Afternoon', habit: '📖 Read 10 pages', done: true },
        { band: 'night', emoji: '🌙', name: 'Night', habit: '👕 Lay out tomorrow’s clothes', done: false },
      ],
    },
    features: {
      title: 'Built so habits stick',
      items: [
        {
          emoji: '🌅',
          title: 'Your day in bands',
          body: 'Morning, afternoon and night, each with its own color. See at a glance what is up next.',
        },
        {
          emoji: '🌳',
          title: 'Your identity tree',
          body: 'Every habit you complete is a vote. Your votes grow a tree that shows who you are becoming.',
        },
        {
          emoji: '🌱',
          title: 'The 2-minute version',
          body: 'Rough day? Do the tiny version. Keeping the habit alive beats doing it perfectly.',
        },
        {
          emoji: '🤗',
          title: 'Never miss twice',
          body: 'One missed day never wipes your progress. Need a break? Mark a rest day on purpose: it never counts as a miss.',
        },
      ],
    },
    science: {
      title: 'Science, not gimmicks',
      body: 'habia is grounded in Atomic Habits and in research on habit formation: start small, decide when and where, stack one habit onto another. No magic promises: a habit takes about 66 days on average to become automatic, not 21.',
    },
    footer: { privacy: 'Privacy', terms: 'Terms', contact: 'Contact', rights: 'Made with care in Colombia.' },
    legal: { updated: 'Last updated', back: 'Back to home' },
  },
} as const;
