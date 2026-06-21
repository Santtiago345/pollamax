export interface NotificationSettings {
  matchReminders: boolean;
  otherBets: boolean;
  streaks: boolean;
  newPlayers: boolean;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  matchReminders: true,
  otherBets: true,
  streaks: true,
  newPlayers: true,
};

// Intervalos de recordatorio antes del partido (en ms)
const REMINDER_INTERVALS = [
  { label: '1 hora', ms: 3600000 },
  { label: '30 minutos', ms: 1800000 },
  { label: '10 minutos', ms: 600000 },
];

// IDs de notificaciones ya enviadas para evitar duplicados
const sentNotifications = new Set<string>();

// Detectar iOS (Safari no soporta Notification API)
export function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !/CriOS/.test(ua);
}

export function isNotificationSupported(): boolean {
  if (isIOS()) return false;
  return 'Notification' in window;
}

export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return Promise.resolve('denied');
  }
  if (Notification.permission === 'default') {
    return Notification.requestPermission();
  }
  return Promise.resolve(Notification.permission);
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export function sendBrowserNotification(title: string, body: string, icon?: string) {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;
  try {
    new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      silent: false,
    });
  } catch (e) {
    console.error('Error sending notification:', e);
  }
}

// Recordatorios locales para iOS (usando alert de la página en lugar de notificación nativa)
export function showInAppAlert(title: string, body: string) {
  // Dispara un evento personalizado que el NotificationBanner puede escuchar
  const event = new CustomEvent('in-app-notification', { detail: { title, body } });
  window.dispatchEvent(event);
}

// Programar recordatorios para un partido
export function scheduleMatchReminders(
  matchId: string,
  matchDate: string,
  teamA: string,
  teamB: string,
  teamAFlag: string,
  teamBFlag: string,
  settings: NotificationSettings,
) {
  if (!settings.matchReminders) return;

  const matchTime = new Date(matchDate).getTime();
  const now = Date.now();

  REMINDER_INTERVALS.forEach(({ label, ms }) => {
    const reminderTime = matchTime - ms;
    const key = `${matchId}_${ms}`;

    // Si ya se envió o ya pasó, saltar
    if (sentNotifications.has(key)) return;
    if (reminderTime <= now) return;

    const delay = reminderTime - now;
    setTimeout(() => {
      if (sentNotifications.has(key)) return;
      sentNotifications.add(key);
      sendBrowserNotification(
        `⚽ ${teamA} vs ${teamB}`,
        `El partido comienza en ${label}. ¡No olvides registrar tu pronóstico!`,
      );
    }, delay);
  });
}

// Limpiar notificaciones viejas periódicamente
export function cleanupSentNotifications() {
  if (sentNotifications.size > 1000) {
    sentNotifications.clear();
  }
}
