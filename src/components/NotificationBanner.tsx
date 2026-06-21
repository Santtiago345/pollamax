'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Smartphone } from 'lucide-react';
import { getNotificationPermission, requestNotificationPermission, isIOS, isNotificationSupported, showInAppAlert } from '@/lib/notifications';

export function NotificationBanner() {
  const [visible, setVisible] = useState(false);
  const [inAppNotif, setInAppNotif] = useState<{ title: string; body: string } | null>(null);

  useEffect(() => {
    const isIOSDevice = isIOS();
    const supported = isNotificationSupported();

    if (!supported && !isIOSDevice) {
      // Navegador sin soporte
      return;
    }

    if (isIOSDevice) {
      // iOS: mostrar banner informativo
      const dismissed = sessionStorage.getItem('notifBannerDismissed');
      if (!dismissed) {
        const timer = setTimeout(() => setVisible(true), 3000);
        return () => clearTimeout(timer);
      }
      return;
    }

    // Navegadores con soporte (Chrome, Firefox, etc.)
    const perm = getNotificationPermission();
    if (perm === 'default') {
      const dismissed = sessionStorage.getItem('notifBannerDismissed');
      if (!dismissed) {
        const timer = setTimeout(() => setVisible(true), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  // Escuchar notificaciones in-app para iOS
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      setInAppNotif(detail);
      setTimeout(() => setInAppNotif(null), 5000);
    };
    window.addEventListener('in-app-notification', handler);
    return () => window.removeEventListener('in-app-notification', handler);
  }, []);

  const handleAccept = async () => {
    if (isIOS()) {
      // En iOS no se puede pedir permiso; solo informar
      alert('En dispositivos iOS, activa las notificaciones desde Ajustes > Safari > Notificaciones (si está disponible). Mientras tanto, verás los avisos dentro de la página.');
      setVisible(false);
      sessionStorage.setItem('notifBannerDismissed', 'true');
      return;
    }

    const perm = await requestNotificationPermission();
    if (perm === 'granted') {
      try {
        new Notification('🔔 Notificaciones activadas', {
          body: 'Recibirás recordatorios de partidos y actividad de la polla.',
          icon: '/favicon.ico',
        });
      } catch (e) {}
    }
    setVisible(false);
    sessionStorage.setItem('notifBannerDismissed', 'true');
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('notifBannerDismissed', 'true');
  };

  const isIOSDevice = isIOS();

  return (
    <>
      {/* Banner de permiso de notificaciones */}
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
                <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${isIOSDevice ? 'bg-blue-500/10' : 'bg-emerald-500/10'}`}>
                  {isIOSDevice ? <Smartphone className="h-5 w-5 text-blue-400" /> : <Bell className="h-5 w-5 text-emerald-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-white">
                    {isIOSDevice ? 'Notificaciones en Pantalla' : 'Activar Notificaciones'}
                  </h4>
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                    {isIOSDevice
                      ? 'En iOS las notificaciones nativas no están disponibles. Verás los avisos importantes directamente en la pantalla de la página.'
                      : 'Recibe recordatorios antes de cada partido (1h, 30min, 10min), entérate de las apuestas de otros jugadores, rachas conseguidas y nuevos participantes.'}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={handleAccept}
                      className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                        isIOSDevice
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                      }`}
                    >
                      {isIOSDevice ? 'Entendido' : 'Aceptar Notificaciones'}
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

      {/* Notificación in-app para iOS (y otros sin soporte) */}
      <AnimatePresence>
        {inAppNotif && (
          <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ duration: 0.3 }}
            className="fixed top-20 right-4 z-[200] max-w-sm w-full"
          >
            <div className="rounded-2xl border border-emerald-500/30 bg-zinc-900 p-4 shadow-2xl shadow-emerald-500/10">
              <div className="flex gap-2">
                <Bell className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-white">{inAppNotif.title}</p>
                  <p className="text-xs text-zinc-400 mt-0.5">{inAppNotif.body}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
