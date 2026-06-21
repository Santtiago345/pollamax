'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trophy, RefreshCw, Star, Medal, HelpCircle, UserPlus, TrendingUp, Bell } from 'lucide-react';
import StreakBadge from '@/components/StreakBadge';
import { getFlagByCountryName } from '@/lib/countries';
import { motion, AnimatePresence } from 'framer-motion';
import { isIOS, isNotificationSupported, showInAppAlert } from '@/lib/notifications';
import { playPodiumRiseSound, playRankChangeSound, initAudio } from '@/lib/sounds';

interface UserProfile {
  uid: string;
  name: string;
  email: string;
  points: number;
  predictions?: {
    champion: string;
    runnerUp: string;
    thirdPlace: string;
    submittedAt: string;
  };
  photoURL?: string;
  streak?: { type: 'exact' | 'winner' | null; count: number };
}

// Hook para animar cambios de posición
function useRankAnimation(users: UserProfile[]) {
  const [animTrigger, setAnimTrigger] = useState(0);
  const prevUsersRef = useRef<UserProfile[]>([]);

  useEffect(() => {
    if (prevUsersRef.current.length === 0) {
      prevUsersRef.current = users;
      setAnimTrigger(t => t + 1);
      return;
    }

    // Detectar cambios de posición (nombres en diferente orden)
    const prevOrder = prevUsersRef.current.map(u => u.uid).join(',');
    const currOrder = users.map(u => u.uid).join(',');
    if (prevOrder !== currOrder) {
      // Guardar en localStorage para que solo anime una vez por visita
      const lastSeenKey = `lastRankOrder_${users.map(u => u.uid).join('_')}`;
      const seen = sessionStorage.getItem(lastSeenKey);
      if (!seen) {
        sessionStorage.setItem(lastSeenKey, 'true');
        setAnimTrigger(t => t + 1);
      }
    }
    prevUsersRef.current = users;
  }, [users]);

  return animTrigger;
}

export default function RankingPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const animTrigger = useRankAnimation(users);
  const [animPlayed, setAnimPlayed] = useState(false);

  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('points', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersList: UserProfile[] = [];
        snapshot.forEach((doc) => {
          usersList.push({ uid: doc.id, ...(doc.data() as any) } as UserProfile);
        });
        // Orden alfabético local para empates
        usersList.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
        setUsers(usersList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching ranking:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Activar animación de entrada después de cargar
  useEffect(() => {
    if (!loading && users.length > 0) {
      initAudio();
      const timer = setTimeout(() => {
        setAnimPlayed(true);
        playPodiumRiseSound();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [loading, users.length]);

  // Sonido cuando cambian posiciones
  useEffect(() => {
    if (animTrigger > 0) {
      playRankChangeSound();
    }
  }, [animTrigger]);

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-10 w-10 animate-spin text-emerald-400" />
          <p className="text-sm font-medium text-emerald-400/80 animate-pulse">Cargando clasificación...</p>
        </div>
      </div>
    );
  }

  const topThree = users.slice(0, 3);
  const leaderboard = users;

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto space-y-8 bg-zinc-950 text-white min-h-[85vh]">
      {/* Cabecera */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Tabla de Posiciones</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Ranking familiar en tiempo real. Los puntajes se actualizan al finalizar cada partido.
        </p>
      </div>

      {users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/10 p-12 text-center">
          <Trophy className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-zinc-300">No hay usuarios registrados</h3>
          <p className="text-zinc-500 text-sm mt-2">
            Nadie se ha registrado en la polla todavía. ¡Sé el primero en invitar a la familia!
          </p>
        </div>
      ) : (
        <>
          {/* Podio Visual con Animación */}
          <div className="relative flex justify-center items-end gap-3 sm:gap-6 pt-8 pb-4 max-w-md mx-auto" style={{ minHeight: 220 }}>
            {/* 2do Puesto */}
            {topThree[1] && (
              <motion.div
                key={`p2-${topThree[1].uid}-${animTrigger}`}
                initial={{ opacity: 0, y: 100 }}
                animate={animPlayed ? { opacity: 1, y: 0 } : {}}
                transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.1 }}
                className="flex flex-col items-center flex-1"
              >
                <motion.div
                  layoutId={`avatar-${topThree[1].uid}`}
                  className="h-10 w-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center font-bold text-zinc-300 shadow text-xs max-w-full truncate px-1"
                >
                  {topThree[1].photoURL ? (
                    <img src={topThree[1].photoURL} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    topThree[1].name.slice(0, 3).toUpperCase()
                  )}
                </motion.div>
                <motion.div
                  layoutId={`bar-${topThree[1].uid}`}
                  className="w-full bg-gradient-to-t from-zinc-800/60 to-zinc-700/80 rounded-t-xl mt-2 flex flex-col items-center justify-center p-3 text-center border-t border-l border-zinc-600/50 shadow-lg"
                  style={{ minHeight: 100 }}
                >
                  <Medal className="h-6 w-6 text-zinc-400 mb-1" />
                  <span className="text-xs font-bold text-zinc-300 truncate max-w-full">{topThree[1].name.split(' ')[0]}</span>
                  <span className="text-lg font-black text-white mt-1">{topThree[1].points} <span className="text-[10px] text-zinc-400 font-normal">pts</span></span>
                  <span className="text-[10px] font-bold text-zinc-400 bg-zinc-900/50 px-1.5 py-0.5 rounded-full mt-1.5">2° Puesto</span>
                </motion.div>
              </motion.div>
            )}

            {/* 1er Puesto */}
            {topThree[0] && (
              <motion.div
                key={`p1-${topThree[0].uid}-${animTrigger}`}
                initial={{ opacity: 0, y: 100 }}
                animate={animPlayed ? { opacity: 1, y: 0 } : {}}
                transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.05 }}
                className="flex flex-col items-center flex-1 z-10"
              >
                <motion.div
                  layoutId={`avatar-${topThree[0].uid}`}
                  className="h-12 w-12 rounded-full bg-amber-500/10 border-2 border-amber-400 flex items-center justify-center font-bold text-amber-400 shadow-lg text-xs max-w-full truncate px-1"
                  animate={animPlayed ? { y: [0, -8, 0] } : {}}
                  transition={{ duration: 0.5, delay: 0.8 }}
                >
                  {topThree[0].photoURL ? (
                    <img src={topThree[0].photoURL} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    topThree[0].name.slice(0, 3).toUpperCase()
                  )}
                </motion.div>
                <motion.div
                  layoutId={`bar-${topThree[0].uid}`}
                  className="w-full bg-gradient-to-t from-amber-600/30 to-amber-500/50 rounded-t-2xl mt-2 flex flex-col items-center justify-center p-4 text-center border-t border-x border-amber-400/40 shadow-xl shadow-amber-500/10"
                  style={{ minHeight: 130 }}
                >
                  <Trophy className="h-8 w-8 text-amber-300 mb-1 filter drop-shadow-md" />
                  <span className="text-sm font-black text-amber-200 truncate max-w-full">{topThree[0].name.split(' ')[0]}</span>
                  <span className="text-2xl font-black text-white mt-1">{topThree[0].points} <span className="text-xs text-amber-200/70 font-normal">pts</span></span>
                  <span className="text-xs font-bold text-amber-300 bg-amber-950/70 border border-amber-500/30 px-2 py-0.5 rounded-full mt-2">LÍDER</span>
                </motion.div>
              </motion.div>
            )}

            {/* 3er Puesto */}
            {topThree[2] && (
              <motion.div
                key={`p3-${topThree[2].uid}-${animTrigger}`}
                initial={{ opacity: 0, y: 100 }}
                animate={animPlayed ? { opacity: 1, y: 0 } : {}}
                transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.15 }}
                className="flex flex-col items-center flex-1"
              >
                <motion.div
                  layoutId={`avatar-${topThree[2].uid}`}
                  className="h-10 w-10 rounded-full bg-orange-950/20 border border-orange-700/50 flex items-center justify-center font-bold text-orange-400 shadow text-xs max-w-full truncate px-1"
                >
                  {topThree[2].photoURL ? (
                    <img src={topThree[2].photoURL} alt="" className="h-full w-full rounded-full object-cover" />
                  ) : (
                    topThree[2].name.slice(0, 3).toUpperCase()
                  )}
                </motion.div>
                <motion.div
                  layoutId={`bar-${topThree[2].uid}`}
                  className="w-full bg-gradient-to-t from-orange-900/20 to-orange-800/40 rounded-t-xl mt-2 flex flex-col items-center justify-center p-3 text-center border-t border-r border-orange-700/30 shadow-lg"
                  style={{ minHeight: 85 }}
                >
                  <Medal className="h-5 w-5 text-orange-400 mb-1" />
                  <span className="text-xs font-bold text-orange-300 truncate max-w-full">{topThree[2].name.split(' ')[0]}</span>
                  <span className="text-lg font-black text-white mt-1">{topThree[2].points} <span className="text-[10px] text-orange-400/80 font-normal">pts</span></span>
                  <span className="text-[10px] font-bold text-orange-400 bg-zinc-900/50 px-1.5 py-0.5 rounded-full mt-1.5">3° Puesto</span>
                </motion.div>
              </motion.div>
            )}
          </div>

          {/* Tabla de clasificación completa */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={animPlayed ? { opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/20 shadow-xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-sm text-zinc-300">
                <thead className="bg-zinc-900/50 text-xs font-bold uppercase tracking-wider text-zinc-400 border-b border-zinc-850">
                  <tr>
                    <th scope="col" className="px-6 py-4 text-center w-16">Pos</th>
                    <th scope="col" className="px-6 py-4">Usuario</th>
                    <th scope="col" className="px-6 py-4 text-center w-28">Puntos</th>
                    <th scope="col" className="px-6 py-4 text-center w-24">Podio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  <AnimatePresence mode="popLayout">
                  {leaderboard.map((profileItem, index) => {
                    const isCurrentUser = user && profileItem.uid === user.uid;
                    const position = index + 1;

                    return (
                      <motion.tr
                        key={profileItem.uid}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.4) }}
                        className={`transition-colors hover:bg-zinc-900/30 ${
                          isCurrentUser
                            ? 'bg-emerald-500/5 border-y border-emerald-500/20'
                            : ''
                        }`}
                      >
                        {/* Posición */}
                        <td className="px-6 py-4 text-center font-bold">
                          {position === 1 ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-black text-black">1</span>
                          ) : position === 2 ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-400 text-xs font-black text-black">2</span>
                          ) : position === 3 ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-700 text-xs font-black text-white">3</span>
                          ) : (
                            <motion.span
                              key={`pos-${position}`}
                              initial={{ scale: 1.5, color: '#34d399' }}
                              animate={{ scale: 1, color: '#71717a' }}
                              transition={{ duration: 0.5 }}
                              className="text-zinc-500"
                            >
                              {position}
                            </motion.span>
                          )}
                        </td>

                        {/* Nombre del jugador */}
                        <td className="px-6 py-4 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center">
                              {profileItem.photoURL ? (
                                <img src={profileItem.photoURL} alt={profileItem.name} className="h-full w-full object-cover" />
                              ) : (
                                <span className="text-xs text-zinc-400">{profileItem.name.slice(0,2).toUpperCase()}</span>
                              )}
                            </div>
                            <span>{profileItem.name}</span>
                            <span className="ml-2">
                              <StreakBadge type={profileItem.streak?.type || null} count={profileItem.streak?.count ?? 0} />
                            </span>
                            {isCurrentUser && (
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">
                                Tú
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Puntos acumulados */}
                        <td className="px-6 py-4 text-center">
                          <motion.span
                            key={`pts-${profileItem.points}`}
                            initial={{ scale: 1.3, color: '#fbbf24' }}
                            animate={{ scale: 1, color: isCurrentUser ? '#34d399' : '#ffffff' }}
                            transition={{ duration: 0.4 }}
                            className={`text-base font-extrabold ${isCurrentUser ? 'text-emerald-400' : 'text-white'}`}
                          >
                            {profileItem.points}
                          </motion.span>
                        </td>

                        {/* Botón para ver predicción de Podio */}
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setSelectedUser(profileItem)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all active:scale-95"
                            title="Ver pronósticos de podio"
                          >
                            <Trophy className="h-4 w-4" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Modal de Detalle de Podio Predicho */}
          {selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
              <div
                className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold border-b border-zinc-800 pb-3 text-white flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-400" />
                  Podio de {selectedUser.name.split(' ')[0]}
                </h3>

                <div className="mt-4 space-y-3.5">
                  {selectedUser.predictions ? (
                    <>
                      <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/5 border border-amber-500/10">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-5 w-5 text-amber-400" />
                          <span className="text-xs text-zinc-400 block font-semibold">Campeón (25 pts)</span>
                        </div>
                        <span className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span className="text-xl">{getFlagByCountryName(selectedUser.predictions.champion)}</span>
                          {selectedUser.predictions.champion}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-500/5 border border-zinc-500/10">
                        <div className="flex items-center gap-2">
                          <Medal className="h-5 w-5 text-zinc-400" />
                          <span className="text-xs text-zinc-400 block font-semibold">Subcampeón (17 pts)</span>
                        </div>
                        <span className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span className="text-xl">{getFlagByCountryName(selectedUser.predictions.runnerUp)}</span>
                          {selectedUser.predictions.runnerUp}
                        </span>
                      </div>

                      <div className="flex items-center justify-between p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                        <div className="flex items-center gap-2">
                          <Medal className="h-5 w-5 text-orange-400" />
                          <span className="text-xs text-zinc-400 block font-semibold">Tercer Puesto (13 pts)</span>
                        </div>
                        <span className="text-sm font-bold text-white flex items-center gap-1.5">
                          <span className="text-xl">{getFlagByCountryName(selectedUser.predictions.thirdPlace)}</span>
                          {selectedUser.predictions.thirdPlace}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-6 text-zinc-500 italic flex flex-col items-center gap-2">
                      <HelpCircle className="h-8 w-8 text-zinc-600" />
                      <span>Este usuario no ha registrado sus predicciones de podio.</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => setSelectedUser(null)}
                  className="mt-6 w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 py-2.5 text-sm font-bold text-white transition-all"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
