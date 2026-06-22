'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { collection, query, orderBy, onSnapshot, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trophy, RefreshCw, Star, Medal, HelpCircle, Swords, TrendingUp, Users, DollarSign, X } from 'lucide-react';
import StreakBadge from '@/components/StreakBadge';
import { motion, AnimatePresence } from 'framer-motion';
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

interface BetDetail {
  matchId: string;
  predA: number;
  predB: number;
  pointsEarned: number;
  processed: boolean;
  matchName: string;
}

function useRankAnimation(users: UserProfile[]) {
  const [animTrigger, setAnimTrigger] = useState(0);
  const prevUsersRef = useRef<UserProfile[]>([]);

  useEffect(() => {
    if (prevUsersRef.current.length === 0) {
      prevUsersRef.current = users;
      setAnimTrigger(t => t + 1);
      return;
    }
    const prevOrder = prevUsersRef.current.map(u => u.uid).join(',');
    const currOrder = users.map(u => u.uid).join(',');
    if (prevOrder !== currOrder) {
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

const DEFAULT_PRIZE_POOL = 500000;

export default function RankingPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedUserBets, setSelectedUserBets] = useState<BetDetail[]>([]);
  const [betsLoading, setBetsLoading] = useState(false);
  const [betCounts, setBetCounts] = useState<Record<string, number>>({});
  const [prizePool, setPrizePool] = useState(DEFAULT_PRIZE_POOL);
  const animTrigger = useRankAnimation(users);
  const [animPlayed, setAnimPlayed] = useState(false);

  // Cargar usuarios
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('points', 'desc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const usersList: UserProfile[] = [];
        snapshot.forEach((doc) => {
          usersList.push({ uid: doc.id, ...(doc.data() as any) } as UserProfile);
        });
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

  // Cargar bote acumulado desde config
  useEffect(() => {
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'config', 'prizePool'));
        if (snap.exists() && snap.data().total != null) setPrizePool(snap.data().total);
      } catch (e) { console.error('Error loading prize pool:', e); }
    };
    load();
  }, []);

  // Cargar conteo de apuestas por usuario
  useEffect(() => {
    const q = query(collection(db, 'bets'), where('processed', '==', true));
    const unsub = onSnapshot(q, (snap) => {
      const counts: Record<string, number> = {};
      snap.forEach(d => {
        const uid = d.data().userId;
        counts[uid] = (counts[uid] || 0) + 1;
      });
      setBetCounts(counts);
    });
    return () => unsub();
  }, []);

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

  useEffect(() => {
    if (animTrigger > 0) {
      playRankChangeSound();
    }
  }, [animTrigger]);

  const handleOpenDetails = async (profileItem: UserProfile) => {
    setSelectedUser(profileItem);
    setSelectedUserBets([]);
    setBetsLoading(true);
    try {
      const q = query(
        collection(db, 'bets'),
        where('userId', '==', profileItem.uid),
        where('processed', '==', true)
      );
      const snap = await getDocs(q);
      const bets: BetDetail[] = snap.docs.map(d => {
        const data = d.data();
        const decoded = decodeMatchId(data.matchId || '');
        return {
          matchId: data.matchId,
          predA: data.predA,
          predB: data.predB,
          pointsEarned: data.pointsEarned || 0,
          processed: data.processed,
          matchName: decoded,
        };
      });
      bets.sort((a, b) => b.pointsEarned - a.pointsEarned);
      setSelectedUserBets(bets);
    } catch (e) {
      console.error('Error loading bets:', e);
    } finally {
      setBetsLoading(false);
    }
  };

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
      {/* Cabecera con stats */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Tabla de Posiciones</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Ranking familiar en tiempo real. Los puntajes se actualizan al finalizar cada partido.
        </p>
      </div>

      {/* Panel de Bote y Participantes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-zinc-900/40 p-4">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <DollarSign className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Bote Acumulado</span>
          </div>
          <span className="text-2xl font-black text-white">${prizePool.toLocaleString('es-CO')}</span>
          <div className="flex flex-col gap-1 mt-2 text-[11px] text-zinc-400">
            <span className="flex items-center gap-1"><Trophy className="h-3 w-3 text-amber-400" /> 1° lugar: <strong className="text-amber-300">${Math.floor(prizePool * 0.6).toLocaleString('es-CO')}</strong></span>
            <span className="flex items-center gap-1"><Medal className="h-3 w-3 text-zinc-400" /> 2° lugar: <strong className="text-zinc-300">${Math.floor(prizePool * 0.4).toLocaleString('es-CO')}</strong></span>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-zinc-900/40 p-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <Users className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Participantes</span>
          </div>
          <span className="text-2xl font-black text-white">{users.length}</span>
          <p className="text-[11px] text-zinc-500 mt-1">Jugadores registrados</p>
        </div>

        <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-zinc-900/40 p-4">
          <div className="flex items-center gap-2 text-blue-400 mb-2">
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs font-bold uppercase tracking-wider">Apuestas Totales</span>
          </div>
          <span className="text-2xl font-black text-white">
            {Object.values(betCounts).reduce((a, b) => a + b, 0)}
          </span>
          <p className="text-[11px] text-zinc-500 mt-1">Pronósticos procesados</p>
        </div>
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
          {/* Podio Visual */}
          <div className="relative flex justify-center items-end gap-3 sm:gap-6 pt-8 pb-4 max-w-md mx-auto" style={{ minHeight: 220 }}>
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

          {/* Tabla de clasificación */}
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
                    <th scope="col" className="px-4 py-4 text-center w-12">Pos</th>
                    <th scope="col" className="px-4 py-4">Usuario</th>
                    <th scope="col" className="px-4 py-4 text-center w-20">Apuestas</th>
                    <th scope="col" className="px-4 py-4 text-center w-20">Puntos</th>
                    <th scope="col" className="px-4 py-4 text-center w-16">Detalle</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  <AnimatePresence mode="popLayout">
                  {leaderboard.map((profileItem, index) => {
                    const isCurrentUser = user && profileItem.uid === user.uid;
                    const position = index + 1;
                    const betCount = betCounts[profileItem.uid] || 0;

                    return (
                      <motion.tr
                        key={profileItem.uid}
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.2, delay: Math.min(index * 0.02, 0.4) }}
                        className={`transition-colors hover:bg-zinc-900/30 ${
                          isCurrentUser ? 'bg-emerald-500/5 border-y border-emerald-500/20' : ''
                        }`}
                      >
                        <td className="px-4 py-4 text-center font-bold">
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

                        <td className="px-4 py-4 font-semibold text-white">
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
                              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full uppercase">Tú</span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4 text-center">
                          <span className="text-sm font-bold text-blue-400">{betCount}</span>
                        </td>

                        <td className="px-4 py-4 text-center">
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

                        <td className="px-4 py-4 text-center">
                          <button
                            onClick={() => handleOpenDetails(profileItem)}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:border-zinc-700 transition-all active:scale-95"
                            title="Ver detalle de puntuación"
                          >
                            <Swords className="h-4 w-4" />
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

          {/* Modal de Detalle de Puntos */}
          {selectedUser && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedUser(null)}>
              <div
                className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Swords className="h-5 w-5 text-emerald-400" />
                    Puntos de {selectedUser.name.split(' ')[0]}
                  </h3>
                  <button onClick={() => setSelectedUser(null)} className="text-zinc-500 hover:text-white transition-colors">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-1 flex items-center justify-between px-1 py-2">
                  <span className="text-xs text-zinc-500">Total acumulado</span>
                  <span className="text-lg font-black text-emerald-400">{selectedUser.points} pts</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 mt-1">
                  {betsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <RefreshCw className="h-6 w-6 animate-spin text-zinc-500" />
                    </div>
                  ) : selectedUserBets.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 italic flex flex-col items-center gap-2">
                      <HelpCircle className="h-8 w-8 text-zinc-600" />
                      <span className="text-sm">No hay apuestas procesadas para este jugador.</span>
                    </div>
                  ) : (
                    selectedUserBets.map((bet, i) => (
                      <motion.div
                        key={`${bet.matchId}-${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center justify-between gap-2 rounded-xl border border-zinc-800/40 bg-zinc-900/20 px-3.5 py-2.5"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-zinc-200 truncate">{bet.matchName}</p>
                          <p className="text-[10px] text-zinc-500">Pronóstico: {bet.predA}-{bet.predB}</p>
                        </div>
                        <span className="text-sm font-black text-emerald-400 shrink-0">+{bet.pointsEarned}</span>
                      </motion.div>
                    ))
                  )}
                </div>

                <button
                  onClick={() => setSelectedUser(null)}
                  className="mt-4 w-full rounded-xl bg-zinc-800 hover:bg-zinc-700 py-2.5 text-sm font-bold text-white transition-all"
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

function decodeMatchId(matchId: string): string {
  if (!matchId) return 'Partido desconocido';
  const parts = matchId.replace('wc2026_', '').split('_');
  if (parts.length < 3) return matchId;
  const date = parts[parts.length - 1];
  const teams = parts.slice(0, -1);
  const mid = Math.ceil(teams.length / 2);
  const teamA = teams.slice(0, mid).join(' ');
  const teamB = teams.slice(mid).join(' ');
  return `${teamA} vs ${teamB}`;
}
