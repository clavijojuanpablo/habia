/**
 * Privacy policy and terms, kept in the repo so they are versioned with the code
 * that they describe. The same text must also be published on the landing page:
 * the stores require a public URL, not only an in-app screen.
 *
 * TODO before launch: replace CONTACT_EMAIL and JURISDICTION, and have a lawyer review.
 */

export const LEGAL_UPDATED = '2026-09-23';
export const CONTACT_EMAIL = 'hola@habia.app';
const JURISDICTION_ES = 'Colombia';
const JURISDICTION_EN = 'Colombia';

export type LegalSection = { heading: string; body: string[] };
export type LegalDocument = { title: string; intro: string; sections: LegalSection[] };

const privacyEs: LegalDocument = {
  title: 'Política de privacidad',
  intro:
    'habia es una app para construir hábitos. Esta política explica qué datos guardamos, para qué, con quién se comparten y cómo puedes borrarlos. En resumen: guardamos lo mínimo para que la app funcione, no vendemos tus datos y puedes eliminar tu cuenta desde la app en cualquier momento.',
  sections: [
    {
      heading: 'Qué datos recogemos',
      body: [
        '• Cuenta: tu correo electrónico y una contraseña cifrada.',
        '• Tus hábitos: nombre, icono, color, frecuencia, horarios, recordatorios, tu versión de 2 minutos, tus intenciones e identidades.',
        '• Tu actividad: qué hábitos completas y cuándo, para calcular rachas, estadísticas y tu árbol.',
        '• Preferencias: idioma, tema (claro u oscuro), franjas del día y zona horaria.',
        '• Datos técnicos mínimos que genera la conexión con nuestro proveedor (por ejemplo, la dirección IP en los registros del servidor).',
      ],
    },
    {
      heading: 'Qué NO recogemos',
      body: [
        'No pedimos tu nombre real, teléfono, ubicación, contactos, fotos ni datos de salud de otras apps. No usamos publicidad ni rastreadores de terceros. No vendemos ni alquilamos tus datos a nadie.',
      ],
    },
    {
      heading: 'Para qué usamos tus datos',
      body: [
        'Únicamente para prestarte el servicio: mostrarte tus hábitos, enviarte los recordatorios que configures, calcular tus estadísticas y tu progreso, y mantener tu cuenta segura.',
      ],
    },
    {
      heading: 'Con quién los compartimos',
      body: [
        '• Supabase, que aloja la base de datos y gestiona el inicio de sesión.',
        '• Cuando actives el coach con inteligencia artificial (función opcional y futura), enviaremos a Anthropic un resumen de tus hábitos, sin tu correo ni tu identidad, para generar los consejos. Te avisaremos antes de activarlo.',
        'Nadie más recibe tus datos, salvo obligación legal.',
      ],
    },
    {
      heading: 'Notificaciones',
      body: [
        'Los recordatorios se programan en tu propio teléfono: para enviarlos no hace falta que tus horarios salgan del dispositivo. Puedes desactivarlos desde la app o desde los ajustes del sistema.',
      ],
    },
    {
      heading: 'Cuánto tiempo los guardamos',
      body: [
        'Mientras tu cuenta exista. Si la eliminas, borramos tus hábitos, registros, identidades y preferencias. El borrado es inmediato y no se puede deshacer; pueden quedar copias temporales en las copias de seguridad del proveedor durante un periodo corto.',
      ],
    },
    {
      heading: 'Tus derechos',
      body: [
        'Puedes acceder a tus datos desde la app, corregirlos y eliminarlos por completo en Perfil → Zona de peligro → Eliminar mi cuenta. Si quieres una copia de tus datos o tienes cualquier duda, escríbenos a ' +
          CONTACT_EMAIL +
          '.',
      ],
    },
    {
      heading: 'Menores de edad',
      body: [
        'habia no está dirigida a menores de 13 años. Si detectamos una cuenta de un menor de esa edad, la eliminaremos.',
      ],
    },
    {
      heading: 'Seguridad',
      body: [
        'Las conexiones viajan cifradas. Cada usuario solo puede leer y escribir sus propios datos: la base de datos aplica esa regla fila por fila, no solo la app. Ningún sistema es infalible, pero trabajamos para mantener tus datos protegidos.',
      ],
    },
    {
      heading: 'Cambios y contacto',
      body: [
        'Si cambiamos esta política te lo avisaremos dentro de la app. Para cualquier consulta: ' + CONTACT_EMAIL + '.',
      ],
    },
  ],
};

const termsEs: LegalDocument = {
  title: 'Términos y condiciones',
  intro: 'Al crear una cuenta en habia aceptas estos términos. Están escritos para que se entiendan.',
  sections: [
    {
      heading: 'Qué es habia',
      body: [
        'Una aplicación para crear y sostener hábitos, con seguimiento, recordatorios y estadísticas. Te damos una licencia personal, no exclusiva y revocable para usarla.',
      ],
    },
    {
      heading: 'Tu cuenta',
      body: [
        'Eres responsable de mantener tu contraseña segura y de la actividad de tu cuenta. Debes tener al menos 13 años para usar habia.',
      ],
    },
    {
      heading: 'No es consejo médico',
      body: [
        'habia es una herramienta de organización personal y motivación, basada en literatura sobre formación de hábitos. No es un servicio médico, psicológico ni terapéutico, y no sustituye la opinión de un profesional. Si atraviesas un problema de salud física o mental, consulta a un especialista.',
      ],
    },
    {
      heading: 'Uso aceptable',
      body: [
        'No puedes usar la app para actividades ilegales, intentar acceder a datos de otras personas, ni interferir con el servicio.',
      ],
    },
    {
      heading: 'Planes de pago',
      body: [
        'Algunas funciones podrán requerir una suscripción. Los precios, la renovación y las cancelaciones se gestionan a través de App Store o Google Play, según sus propias reglas de reembolso. Te informaremos del precio antes de cobrar.',
      ],
    },
    {
      heading: 'Tus datos y contenido',
      body: [
        'Tus hábitos y registros son tuyos. No los usamos con fines distintos a prestarte el servicio, tal como se explica en la Política de privacidad.',
      ],
    },
    {
      heading: 'Disponibilidad y cambios',
      body: [
        'Trabajamos para que la app funcione siempre, pero puede haber interrupciones o cambios en las funciones. Podemos actualizar estos términos; los cambios relevantes se avisarán dentro de la app.',
      ],
    },
    {
      heading: 'Cancelación',
      body: [
        'Puedes eliminar tu cuenta cuando quieras desde la app. Podemos suspender cuentas que incumplan estos términos.',
      ],
    },
    {
      heading: 'Responsabilidad',
      body: [
        'La app se ofrece "tal cual". En la medida en que la ley lo permita, no respondemos por daños indirectos derivados del uso de la app.',
      ],
    },
    {
      heading: 'Ley aplicable y contacto',
      body: [
        'Estos términos se rigen por las leyes de ' + JURISDICTION_ES + '. Para cualquier consulta: ' + CONTACT_EMAIL + '.',
      ],
    },
  ],
};

const privacyEn: LegalDocument = {
  title: 'Privacy policy',
  intro:
    'habia is a habit-building app. This policy explains what we store, why, who we share it with and how you can delete it. In short: we store the minimum the app needs, we never sell your data, and you can delete your account from inside the app at any time.',
  sections: [
    {
      heading: 'What we collect',
      body: [
        '• Account: your email address and an encrypted password.',
        '• Your habits: name, icon, color, frequency, times, reminders, your 2-minute version, intentions and identities.',
        '• Your activity: which habits you complete and when, to compute streaks, stats and your tree.',
        '• Preferences: language, theme, day bands and time zone.',
        '• Minimal technical data produced by the connection to our provider (for example, the IP address in server logs).',
      ],
    },
    {
      heading: 'What we do NOT collect',
      body: [
        'We never ask for your real name, phone number, location, contacts, photos or health data from other apps. No ads, no third-party trackers. We do not sell or rent your data.',
      ],
    },
    {
      heading: 'Why we use your data',
      body: [
        'Only to provide the service: show your habits, send the reminders you set up, compute your stats and progress, and keep your account secure.',
      ],
    },
    {
      heading: 'Who we share it with',
      body: [
        '• Supabase, which hosts the database and handles sign-in.',
        '• When you enable the AI coach (an optional, upcoming feature), we send Anthropic a summary of your habits, without your email or identity, to generate the advice. We will tell you before enabling it.',
        'Nobody else receives your data, unless legally required.',
      ],
    },
    {
      heading: 'Notifications',
      body: [
        'Reminders are scheduled on your own device: your schedule does not need to leave the phone to deliver them. You can turn them off in the app or in system settings.',
      ],
    },
    {
      heading: 'How long we keep it',
      body: [
        'As long as your account exists. If you delete it, we delete your habits, logs, identities and preferences. Deletion is immediate and cannot be undone; short-lived copies may remain in the provider backups for a brief period.',
      ],
    },
    {
      heading: 'Your rights',
      body: [
        'You can access your data in the app, correct it, and delete everything in Profile → Danger zone → Delete my account. For a copy of your data or any question, write to ' +
          CONTACT_EMAIL +
          '.',
      ],
    },
    {
      heading: 'Children',
      body: ['habia is not directed at children under 13. If we find such an account, we will delete it.'],
    },
    {
      heading: 'Security',
      body: [
        'Connections are encrypted. Each user can only read and write their own rows: the database enforces that rule per row, not just the app. No system is perfect, but we work to keep your data safe.',
      ],
    },
    {
      heading: 'Changes and contact',
      body: ['If this policy changes we will tell you in the app. Questions: ' + CONTACT_EMAIL + '.'],
    },
  ],
};

const termsEn: LegalDocument = {
  title: 'Terms and conditions',
  intro: 'By creating a habia account you accept these terms. They are written to be understood.',
  sections: [
    {
      heading: 'What habia is',
      body: [
        'An app to build and keep habits, with tracking, reminders and stats. We grant you a personal, non-exclusive, revocable license to use it.',
      ],
    },
    {
      heading: 'Your account',
      body: [
        'You are responsible for keeping your password safe and for the activity on your account. You must be at least 13 to use habia.',
      ],
    },
    {
      heading: 'Not medical advice',
      body: [
        'habia is a personal organization and motivation tool based on habit-formation literature. It is not a medical, psychological or therapeutic service and does not replace a professional. If you are facing a physical or mental health problem, consult a specialist.',
      ],
    },
    {
      heading: 'Acceptable use',
      body: [
        'You may not use the app for illegal activity, attempt to access other people’s data, or interfere with the service.',
      ],
    },
    {
      heading: 'Paid plans',
      body: [
        'Some features may require a subscription. Pricing, renewal and cancellation are handled by the App Store or Google Play under their own refund rules. We will show the price before charging.',
      ],
    },
    {
      heading: 'Your data and content',
      body: [
        'Your habits and logs are yours. We do not use them for anything other than providing the service, as described in the Privacy policy.',
      ],
    },
    {
      heading: 'Availability and changes',
      body: [
        'We work to keep the app running, but there may be interruptions or changes to features. We may update these terms; relevant changes will be announced in the app.',
      ],
    },
    {
      heading: 'Termination',
      body: [
        'You can delete your account at any time from the app. We may suspend accounts that break these terms.',
      ],
    },
    {
      heading: 'Liability',
      body: [
        'The app is provided "as is". To the extent permitted by law, we are not liable for indirect damages arising from its use.',
      ],
    },
    {
      heading: 'Governing law and contact',
      body: ['These terms are governed by the laws of ' + JURISDICTION_EN + '. Questions: ' + CONTACT_EMAIL + '.'],
    },
  ],
};

export const LEGAL = {
  es: { privacy: privacyEs, terms: termsEs },
  en: { privacy: privacyEn, terms: termsEn },
} as const;

export type LegalKind = keyof (typeof LEGAL)['es'];

/** Falls back to Spanish, the project's primary language. */
export function getLegal(kind: LegalKind, language: string): LegalDocument {
  const lang = language.startsWith('en') ? 'en' : 'es';
  return LEGAL[lang][kind];
}
