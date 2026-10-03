/**
 * Privacy policy and terms, kept in the repo so they are versioned with the code
 * that they describe. The same text must also be published on the landing page:
 * the stores require a public URL, not only an in-app screen.
 *
 * TODO before launch: confirm JURISDICTION and have a lawyer review.
 */

export const LEGAL_UPDATED = '2026-10-03';
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
        '• Tus hábitos: nombre, icono, color, frecuencia, horarios, recordatorios, tu versión de 2 minutos, dónde los haces e identidades.',
        '• Tu actividad: qué hábitos completas y cuándo, para calcular rachas, estadísticas y tu árbol.',
        '• Preferencias: idioma, tema (claro u oscuro), franjas del día y zona horaria.',
        '• Si activas la revisión semanal con IA: las revisiones que Brote te escribe.',
        '• Si agregas amigos o te unes a círculos: tu usuario, nombre visible y color; tus amistades, solicitudes y círculos; los ánimos que envías y recibes; y las personas que bloqueas o reportas.',
        '• Si un hábito de tu círculo va con foto: las fotos que tomas con la cámara (se borran a los 7 días). Si activas los avisos: el identificador de notificaciones de tu teléfono.',
        '• Si te suscribes a habia Pro: el estado de tu suscripción (plan, hasta cuándo dura y si se renueva). Nunca tus datos de pago: el cobro lo hace Apple.',
        '• Datos técnicos mínimos que genera la conexión con nuestro proveedor (por ejemplo, la dirección IP en los registros del servidor).',
        '• Informes de errores: si la app falla, un informe técnico (qué falló, modelo de teléfono, versión del sistema) asociado al identificador interno de tu cuenta (un código, no tu nombre ni tu correo).',
        '• Datos de uso, si no los desactivas: qué pantallas abres, acciones como crear un hábito o marcarlo y tus respuestas a la pregunta breve "¿habia te está ayudando?", asociados al mismo identificador interno, junto con el modelo de tu teléfono, su idioma y su zona horaria. Nunca los nombres de tus hábitos ni tu correo. Nos dicen qué funciona y qué no.',
      ],
    },
    {
      heading: 'Qué NO recogemos',
      body: [
        'No pedimos tu nombre real, teléfono, ubicación, contactos, las fotos de tu galería ni datos de salud de otras apps. No usamos publicidad ni seguimos tu actividad en otras apps o sitios web. No vendemos ni alquilamos tus datos a nadie.',
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
        '• Sentry, que recibe los informes de errores para que podamos arreglarlos.',
        '• RevenueCat, que gestiona las suscripciones a habia Pro con Apple: recibe el identificador interno de tu cuenta (un código, no tu nombre ni tu correo) y tus compras dentro de la app, para saber si eres Pro en todos tus dispositivos.',
        '• Expo (el servicio de notificaciones push), solo si las activas: recibe el identificador de notificaciones de tu teléfono y el texto de cada aviso (por ejemplo, el nombre de quien te animó) para entregarlo a Apple o Google.',
        '• PostHog, que recibe los datos de uso. Puedes desactivarlos en Ajustes → Ayudar a mejorar habia.',
        '• Anthropic (Claude), solo si activas la revisión semanal con IA (desactivada por defecto; Ajustes → Revisión semanal con IA). Una vez por semana le enviamos un resumen de tu semana para que escriba la revisión: los nombres de tus hábitos, sus identidades y lugares, cuántas veces los hiciste y tu nombre visible si lo pusiste; nunca tu correo. Según sus condiciones para la API, Anthropic no usa estos datos para entrenar sus modelos. Puedes desactivarla cuando quieras.',
        '• Tus amigos y las personas de tus círculos, solo si agregas amigos o círculos: ven tu usuario, nombre y color, tu racha y tu récord, tu constancia de los últimos 30 días, tus semillas, la etapa de tu árbol y qué días completaste algún hábito o descansaste a propósito. Nunca los nombres de tus hábitos, tus identidades ni tu correo. Puedes eliminar amigos, salir de un círculo o bloquear a alguien en cualquier momento.',
        '• Las personas de un círculo, solo para los hábitos de círculo que creas o a los que te unes: ven ese hábito (que el círculo definió), desde cuándo te uniste, qué días lo cumpliste o descansaste y, si el hábito va con foto, las fotos que tomes con la cámara. Las fotos se borran a los 7 días; puedes borrar la tuya antes. Los demás pueden votar en privado que una foto «no cuenta» (si la mayoría lo hace, ese día no suma a la racha del grupo; nunca se muestra quién votó, aunque en un hábito de dos personas se puede deducir) o reportarla como inapropiada: deja de verla quien la reporta y, con dos reportes, se oculta para todos mientras la revisamos. Si sales del círculo o archivas el hábito, deja de compartirse.',
        'Nadie más recibe tus datos, salvo obligación legal.',
      ],
    },
    {
      heading: 'Notificaciones',
      body: [
        'Los recordatorios se programan en tu propio teléfono: para enviarlos no hace falta que tus horarios salgan del dispositivo. Puedes desactivarlos desde la app o desde los ajustes del sistema.',
        'Los avisos de amigos y círculos (ánimos, solicitudes, «ya regó en tu círculo») se envían desde nuestro servidor, nunca más de uno igual al día. Se apagan en Ajustes → Avisos de amigos y círculos, o desde los ajustes del sistema.',
      ],
    },
    {
      heading: 'Cuánto tiempo los guardamos',
      body: [
        'Mientras tu cuenta exista. Si la eliminas, borramos tus hábitos, registros, identidades y preferencias. El borrado es inmediato y no se puede deshacer; pueden quedar copias temporales en las copias de seguridad del proveedor durante un periodo corto. Los informes de errores y los datos de uso ya enviados a Sentry y PostHog se conservan según sus plazos de retención; al eliminar tu cuenta, su identificador deja de corresponder a ninguna persona. Apple y RevenueCat conservan el historial de compras que la ley contable les exige; eliminar tu cuenta no cancela una suscripción activa: cancélala en los Ajustes del iPhone.',
      ],
    },
    {
      heading: 'Tus derechos',
      body: [
        'Puedes acceder a tus datos desde la app, corregirlos y eliminarlos por completo en Ajustes → Zona de peligro → Eliminar mi cuenta. Si quieres una copia de tus datos o tienes cualquier duda, escríbenos a ' +
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
        'Las conexiones viajan cifradas. Cada usuario solo puede leer y escribir sus propios datos, más el resumen que sus amigos comparten (descrito arriba): la base de datos aplica esa regla fila por fila, no solo la app. Ningún sistema es infalible, pero trabajamos para mantener tus datos protegidos.',
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
        'Entre amigos y en los círculos no toleramos nombres ofensivos, acoso, suplantación ni spam. Puedes bloquear o reportar a cualquier persona desde su perfil; revisamos los reportes y podemos retirar contenido y suspender o eliminar las cuentas que incumplan estas reglas.',
      ],
    },
    {
      heading: 'Planes de pago',
      body: [
        'habia Pro es una suscripción mensual o anual que se compra dentro de la app. Antes de pagar ves el precio, el periodo y, si te corresponde, los días de prueba gratis (una prueba por persona).',
        'El cobro lo hace Apple con tu cuenta al confirmar la compra o, si empezaste una prueba, cuando esta termina. La suscripción se renueva automáticamente al mismo precio salvo que la canceles al menos 24 horas antes del final del periodo; puedes gestionarla o cancelarla en Ajustes del iPhone → tu nombre → Suscripciones. Al cancelar, sigues siendo Pro hasta el final del periodo pagado.',
        'Los reembolsos los decide Apple según sus reglas (reportaproblem.apple.com). Si cambiamos el precio, Apple te avisará antes y, cuando la ley lo exija, te pedirá aceptarlo. Las funciones gratuitas pueden cambiar, pero nunca te quitaremos tus datos.',
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
        '• Your habits: name, icon, color, frequency, times, reminders, your 2-minute version, where you do them and identities.',
        '• Your activity: which habits you complete and when, to compute streaks, stats and your tree.',
        '• Preferences: language, theme, day bands and time zone.',
        '• If you turn on the AI weekly review: the reviews Brote writes for you.',
        '• If you add friends or join circles: your username, display name and color; your friendships, requests and circles; the cheers you send and receive; and the people you block or report.',
        '• If a habit of your circle comes with a photo: the photos you take with the camera (deleted after 7 days). If you turn on notifications: your phone’s notification id.',
        '• If you subscribe to habia Pro: your subscription status (plan, until when it lasts and whether it renews). Never your payment details: Apple handles the charge.',
        '• Minimal technical data produced by the connection to our provider (for example, the IP address in server logs).',
        '• Error reports: if the app crashes, a technical report (what failed, phone model, OS version) tied to your account’s internal id (a code, not your name or email).',
        '• Usage data, unless you turn it off: which screens you open, actions such as creating or checking a habit and your answers to the short "is habia helping?" question, tied to the same internal id, along with your phone model, language and time zone. Never your habit names or email. It tells us what works and what does not.',
      ],
    },
    {
      heading: 'What we do NOT collect',
      body: [
        'We never ask for your real name, phone number, location, contacts, the photos in your library or health data from other apps. No ads, and we do not follow your activity across other apps or websites. We do not sell or rent your data.',
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
        '• Sentry, which receives error reports so we can fix them.',
        '• RevenueCat, which manages habia Pro subscriptions with Apple: it receives your account’s internal id (a code, not your name or email) and your in-app purchases, so Pro follows you on all your devices.',
        '• Expo (the push notification service), only if you turn them on: it receives your phone’s notification id and the text of each notice (for example, the name of who cheered you on) to deliver it through Apple or Google.',
        '• PostHog, which receives the usage data. You can turn it off in Settings → Help improve habia.',
        '• Anthropic (Claude), only if you turn on the AI weekly review (off by default; Settings → AI weekly review). Once a week we send it a summary of your week so it can write the review: your habit names, their identities and places, how many times you did them and your display name if you set one; never your email. Under its API terms, Anthropic does not use this data to train its models. You can turn it off at any time.',
        '• Your friends and the people in your circles, only if you add friends or circles: they see your username, name and color, your streak and record, your consistency over the last 30 days, your seeds, your tree stage and which days you completed a habit or rested on purpose. Never your habit names, your identities or your email. You can remove friends, leave a circle or block someone at any time.',
        '• The people in a circle, only for the circle habits you create or join: they see that habit (defined by the circle), since when you joined, which days you did it or rested and, if the habit comes with a photo, the photos you take with the camera. Photos are deleted after 7 days; you can delete yours sooner. Others can privately vote that a photo “doesn’t count” (if most do, that day doesn’t count toward the group streak; who voted is never shown, though in a habit of two it can be worked out) or report it as inappropriate: it disappears for whoever reports it and, with two reports, it is hidden for everyone while we review it. If you leave the circle or archive the habit, it is no longer shared.',
        'Nobody else receives your data, unless legally required.',
      ],
    },
    {
      heading: 'Notifications',
      body: [
        'Reminders are scheduled on your own device: your schedule does not need to leave the phone to deliver them. You can turn them off in the app or in system settings.',
        'Friends and circles notifications (cheers, requests, “already watered in your circle”) are sent from our server, never the same one twice a day. Turn them off in Settings → Friends & circles notifications, or in system settings.',
      ],
    },
    {
      heading: 'How long we keep it',
      body: [
        'As long as your account exists. If you delete it, we delete your habits, logs, identities and preferences. Deletion is immediate and cannot be undone; short-lived copies may remain in the provider backups for a brief period. Error reports and usage data already sent to Sentry and PostHog are kept for their retention periods; once your account is deleted, their id no longer maps to anyone. Apple and RevenueCat keep the purchase history accounting law requires; deleting your account does not cancel an active subscription: cancel it in iPhone Settings.',
      ],
    },
    {
      heading: 'Your rights',
      body: [
        'You can access your data in the app, correct it, and delete everything in Settings → Danger zone → Delete my account. For a copy of your data or any question, write to ' +
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
        'Connections are encrypted. Each user can only read and write their own rows, plus the summary their friends share (described above): the database enforces that rule per row, not just the app. No system is perfect, but we work to keep your data safe.',
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
        'Between friends and in circles we do not tolerate offensive names, harassment, impersonation or spam. You can block or report anyone from their profile; we review reports and may remove content and suspend or delete accounts that break these rules.',
      ],
    },
    {
      heading: 'Paid plans',
      body: [
        'habia Pro is a monthly or yearly subscription bought inside the app. Before paying you see the price, the period and, if you qualify, the free trial days (one trial per person).',
        'Apple charges your account when you confirm the purchase or, if you started a trial, when it ends. The subscription renews automatically at the same price unless cancelled at least 24 hours before the end of the period; manage or cancel it in iPhone Settings → your name → Subscriptions. After cancelling you stay Pro until the end of the paid period.',
        'Refunds are decided by Apple under its rules (reportaproblem.apple.com). If we change the price, Apple tells you first and, where the law requires it, asks you to accept it. Free features may change, but we will never take your data away.',
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
