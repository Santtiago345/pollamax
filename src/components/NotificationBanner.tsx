'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X } from 'lucide-react';
import { getNotificationPermission, requestNotificationPermission } from '@/lib/notifications';

export function NotificationBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const perm = getNotificationPermission();
    if (perm === 'default') {
      const dismissed = sessionStorage.getItem('notifBannerDismissed');
      if (!dismissed) {
        // Mostrar después de 3 segundos
        const timer = setTimeout(() => setVisible(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleAccept = async () => {
    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      new Notification('🔔 Notificaciones activadas', {
        body: 'Recibirás recordatorios de partidos y actividad de la polla.',
        icon: '/favicon.ico',
      });
    }
    setVisible(false);
    sessionStorage.setItem('notifBannerDismissed', 'true');
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('notifBannerDismissed', 'true');
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-4 right-4 z-[200] max-w-sm w-full"
        >
          <div className="rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 shadow-2xl shadow-emerald-500/10">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="flex gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Bell className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white">Activar Notificaciones</h4>
                <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                  Recibe recordatorios antes de cada partido (1h, 30min, 10min), entérate de las apuestas
                  de otros jugadores, rachas conseguidas y nuevos participantes. Solo necesitas aceptar
                  las notificaciones en tu navegador o móvil.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={handleAccept}
                    className="flex-1 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all"
                  >
                    Aceptar Notificaciones
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition-all"
                  >
                    Ahora no
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
