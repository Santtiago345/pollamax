'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from './AuthProvider';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { playWelcomeSound, initAudio } from '@/lib/sounds';
import { Trophy, Sparkles } from 'lucide-react';

export function WelcomeScreen() {
  const { user, profile } = useAuth();
  const [show, setShow] = useState(false);
  const musicPlayed = useRef(false);
  const dismissedRef = useRef(false);

  useEffect(() => {
    if (!user || !profile) { setShow(false); return; }
    if (dismissedRef.current) return;

    const isNewUser = (profile as any).joinedAt && !(profile as any).welcomeSeen;

    if (isNewUser) {
      const timer = setTimeout(() => {
        setShow(true);
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setShow(false);
    }
  }, [user, profile]);

  const handleDismiss = async () => {
    dismissedRef.current = true;
    setShow(false);
    if (!user) return;
    try {
      await updateDoc(doc(db, 'users', user.uid), { welcomeSeen: true });
    } catch (e) {
      console.error('Error saving welcomeSeen:', e);
    }
  };

  useEffect(() => {
    if (show && !musicPlayed.current) {
      musicPlayed.current = true;
      initAudio();
      setTimeout(() => playWelcomeSound(), 200);
    }
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-md"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ scale: 0.7, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 18, stiffness: 180, delay: 0.1 }}
            className="relative max-w-lg w-full mx-4 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-zinc-900 via-zinc-950 to-emerald-950/40 p-8 sm:p-10 shadow-2xl shadow-emerald-500/10 text-center overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Fondo decorativo */}
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-emerald-500/15 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-amber-500/10 rounded-full blur-[70px] pointer-events-none" />

            <div className="relative z-10 space-y-6">
              {/* Icono animado */}
              <motion.div
                animate={{ rotate: [0, -8, 8, -4, 0], scale: [1, 1.1, 1.1, 1] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg shadow-emerald-500/30"
              >
                <Trophy className="h-10 w-10 text-amber-300" />
              </motion.div>

              {/* Estrellas decorativas */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
                className="absolute top-6 right-8 opacity-30"
              >
                <Sparkles className="h-6 w-6 text-amber-400" />
              </motion.div>

              {/* Texto */}
              <div className="space-y-2">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl sm:text-3xl font-extrabold text-white"
                >
                  ¡Bienvenido a{' '}
                  <span className="bg-gradient-to-r from-emerald-400 to-amber-300 bg-clip-text text-transparent">
                    PollaMax
                  </span>
                  {profile?.name ? `, ${profile.name.split(' ')[0]}!` : '!'}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  className="text-zinc-400 text-sm sm:text-base leading-relaxed"
                >
                  Prepárate para vivir el Mundial 2026 como nunca antes.
                  Pronostica los partidos, acumula puntos, activa rachas y compite
                  con tu familia para llegar a lo más alto del ranking.
                </motion.p>
              </div>

              {/* Tarjetas de funcionalidades */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="grid grid-cols-2 gap-3 text-left"
              >
                {[
                  { emoji: '⚽', label: 'Pronostica partidos', desc: 'Antes del pitazo inicial' },
                  { emoji: '🔥', label: 'Activa rachas', desc: 'Aciertos consecutivos + bonus' },
                  { emoji: '🏆', label: 'Sube en el ranking', desc: 'Compite con tu familia' },
                  { emoji: '📊', label: 'Sigue el Mundial', desc: 'Grupos, llaves y resultados' },
                ].map((item, i) => (
                  <div key={i} className="rounded-xl bg-white/5 border border-zinc-800/50 p-3 space-y-0.5">
                    <div className="text-lg">{item.emoji}</div>
                    <div className="text-xs font-bold text-white">{item.label}</div>
                    <div className="text-[10px] text-zinc-500">{item.desc}</div>
                  </div>
                ))}
              </motion.div>

              {/* Botón */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                onClick={handleDismiss}
                className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                ¡Comenzar!
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
