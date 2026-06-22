'use client';

import { useEffect, useRef } from 'react';
import { collection, query, onSnapshot, doc, getDoc, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  requestNotificationPermission,
  getNotificationPermission,
  scheduleMatchReminders,
  cleanupSentNotifications,
  sendBrowserNotification,
  showInAppAlert,
  isIOS,
  isNotificationSupported,
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
  const seenHistoryRef = useRef<Set<string>>(new Set());
  const knownUsersRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    const notify = (title: string, body: string) => {
      if (isIOS() || !isNotificationSupported()) {
        showInAppAlert(title, body);
      } else if (getNotificationPermission() === 'granted') {
        sendBrowserNotification(title, body);
      }
    };

    const loadSettings = async () => {
      try {
        const userSnap = await getDoc(doc(db, 'users', userId));
        if (userSnap.exists()) {
          const prefs = userSnap.data().notificationPreferences;
          if (prefs) {
            settingsRef.current = { ...DEFAULT_NOTIFICATION_SETTINGS, ...prefs };
          }
        }
      } catch (e) {
        console.error('Error loading notification settings:', e);
      }
    };

    loadSettings();

    // Escuchar nuevos usuarios
    const usersUnsub = onSnapshot(collection(db, 'users'), (snap) => {
      snap.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          if (data.uid === userId) return;
          if (knownUsersRef.current.has(change.doc.id)) return;
          knownUsersRef.current.add(change.doc.id);
          if (!settingsRef.current.newPlayers) return;
          notify('👋 Nuevo jugador', `${data.name || 'Alguien'} se unió a la PollaMax!`);
        }
      });
    });

    // Escuchar historial para apuestas y rachas
    const historyUnsub = onSnapshot(
      query(collection(db, 'history'), orderBy('timestamp', 'desc'), limit(10)),
      (snap) => {
        snap.docChanges().forEach((change) => {
          if (change.type !== 'added') return;
          const data = change.doc.data();
          if (!data.message) return;
          if (data.userId === userId) return;
          if (seenHistoryRef.current.has(change.doc.id)) return;
          seenHistoryRef.current.add(change.doc.id);

          const msg = data.message || '';
          if (msg.includes('Racha') && settingsRef.current.streaks) {
            notify('🔥 Racha!', `${data.userName || 'Alguien'} consiguió una racha!`);
          } else if ((msg.includes('apuesta') || msg.includes('Apuesta') || msg.includes('sumó')) && settingsRef.current.otherBets) {
            notify('📊 Apuesta registrada', `${data.userName || 'Alguien'} realizó una apuesta.`);
          }
        });
      }
    );

    // Escuchar partidos y programar recordatorios
    const matchUnsub = onSnapshot(query(collection(db, 'matches')), (snapshot) => {
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
          match.id, match.date, match.teamA, match.teamB,
          match.teamAFlag || '🏳️', match.teamBFlag || '🏳️',
          settingsRef.current,
        );
      });

      cleanupSentNotifications();
    });

    return () => {
      usersUnsub();
      historyUnsub();
      matchUnsub();
    };
  }, [userId]);
}
