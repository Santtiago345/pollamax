'use client';

import { useEffect, useRef } from 'react';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  requestNotificationPermission,
  getNotificationPermission,
  scheduleMatchReminders,
  cleanupSentNotifications,
  DEFAULT_NOTIFICATION_SETTINGS,
  type NotificationSettings,
} from '@/lib/notifications';

interface MatchData {
  id: string;
  teamA: string;
  teamB: string;
  teamAFlag: string;
  teamBFlag: string;
  date: string;
  status: string;
}

export function useMatchNotifications(userId: string | undefined) {
  const settingsRef = useRef<NotificationSettings>(DEFAULT_NOTIFICATION_SETTINGS);
  const scheduledRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    // Cargar settings de notificaciones del usuario
    const loadSettings = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          const prefs = data.notificationPreferences;
          if (prefs) {
            settingsRef.current = { ...DEFAULT_NOTIFICATION_SETTINGS, ...prefs };
          }
        }
      } catch (e) {
        console.error('Error loading notification settings:', e);
      }
    };

    loadSettings();

    // Verificar permiso y pedir si es necesario
    const perm = getNotificationPermission();
    if (perm === 'default') {
      // No pedir automáticamente - se hará desde el banner
    }

    // Escuchar partidos y programar recordatorios
    const q = query(collection(db, 'matches'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const now = Date.now();
      const in48h = now + 48 * 3600000;

      snapshot.forEach((matchDoc) => {
        const match = matchDoc.data() as MatchData;
        if (!match.date || match.status !== 'scheduled') return;

        const matchTime = new Date(match.date).getTime();
        if (matchTime < now || matchTime > in48h) return;
        if (scheduledRef.current.has(match.id)) return;

        scheduledRef.current.add(match.id);
        scheduleMatchReminders(
          match.id,
          match.date,
          match.teamA,
          match.teamB,
          match.teamAFlag || '🏳️',
          match.teamBFlag || '🏳️',
          settingsRef.current,
        );
      });

      cleanupSentNotifications();
    });

    return () => unsubscribe();
  }, [userId]);
}
