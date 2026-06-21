'use client';

import React, { useState, useEffect } from 'react';
import { doc, setDoc, addDoc, collection, getDocs, query, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { isBetLocked, calculatePoints } from '@/lib/rules';
import { Lock, Unlock, Check, RefreshCw, AlertCircle } from 'lucide-react';
import StreakBadge from '@/components/StreakBadge';
import { playBetSound, initAudio } from '@/lib/sounds';

interface Match {
  id: string;
  teamA: string;
  teamB: string;
  teamAFlag: string;
  teamBFlag: string;
  date: string;
  scoreA: number | null;
  scoreB: number | null;
  status: 'scheduled' | 'live' | 'finished';
}

interface Bet {
  id: string;
  userId: string;
  userName: string;
  matchId: string;
  predA: number;
  predB: number;
  pointsEarned?: number;
  processed: boolean;
}

interface MatchCardProps {
  match: Match;
  userBet: Bet | undefined;
  userId: string;
  userName: string;
  userPhoto?: string | null;
}

export const MatchCard: React.FC<MatchCardProps> = ({ match, userBet, userId, userName, userPhoto }) => {
  const [predA, setPredA] = useState<string>(userBet ? String(userBet.predA) : '');
  const [predB, setPredB] = useState<string>(userBet ? String(userBet.predB) : '');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [locked, setLocked] = useState(isBetLocked(match.date));

  // Actualizar predicción si cambia externamente (ej: al cargar)
  useEffect(() => {
    if (userBet) {
      setPredA(String(userBet.predA));
      setPredB(String(userBet.predB));
    }
  }, [userBet]);

  // Verificar periódicamente si el partido se ha bloqueado
  useEffect(() => {
    const timer = setInterval(() => {
      setLocked(isBetLocked(match.date));
    }, 10000); // Cada 10 segundos
    return () => clearInterval(timer);
  }, [match.date]);

  const handleSaveBet = async () => {
    if (locked || match.status !== 'scheduled') return;
    
    const goalA = parseInt(predA, 10);
    const goalB = parseInt(predB, 10);

    if (isNaN(goalA) || isNaN(goalB) || goalA < 0 || goalB < 0) {
      alert('Por favor ingresa marcadores válidos (números enteros mayores o iguales a 0).');
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      const betId = `${userId}_${match.id}`;
      const betRef = doc(db, 'bets', betId);
      
      const newBet: any = {
        id: betId,
        userId,
        userName,
        userPhoto: userPhoto || null,
        matchId: match.id,
        predA: goalA,
        predB: goalB,
        processed: false,
        createdAt: new Date().toISOString()
      };

      // Guardar apuesta (set con merge por seguridad)
      await setDoc(betRef, newBet, { merge: true });

      // Crear entrada en el historial de actividad con avatar si existe
      const historyRef = collection(db, 'history');
      await addDoc(historyRef, {
        userId,
        userName,
        userPhoto: userPhoto || null,
        message: `${userName} apostó ${goalA}-${goalB} en ${match.teamA} vs ${match.teamB}`,
        timestamp: new Date().toISOString(),
      });

      // Sonido de apuesta exitosa
      initAudio();
      playBetSound();

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving bet', error);
      alert(`Error al guardar tu apuesta. Inténtalo de nuevo. (${(error instanceof Error ? error.message : 'unknown')})`);
    } finally {
      setLoading(false);
    }
  };

  // Comparar con otros jugadores: modal
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareLoading, setCompareLoading] = useState(false);
  const [compareList, setCompareList] = useState<Array<any>>([]);

  const openCompare = async () => {
    setCompareOpen(true);
    setCompareLoading(true);
    try {
      const q = query(collection(db, 'bets'), where('matchId', '==', match.id));
      const snap = await getDocs(q);
      const results: any[] = [];

      for (const d of snap.docs) {
        const b = d.data();
        // Obtener info del usuario (puntos y racha)
        const userRef = doc(db, 'users', b.userId);
        const userSnap = await getDoc(userRef);
        const userData = userSnap.exists() ? userSnap.data() : {};

        results.push({
          bet: b,
          user: {
            uid: b.userId,
            name: b.userName,
            photoURL: b.userPhoto || userData.photoURL || null,
            points: userData.points || 0,
            streak: userData.streak || { type: null, count: 0 }
          }
        });
      }

      // Ordenar por puntos desc
      results.sort((a, b) => (b.user.points || 0) - (a.user.points || 0));
      setCompareList(results);
    } catch (err) {
      console.error('Error fetching compare list', err);
      setCompareList([]);
    } finally {
      setCompareLoading(false);
    }
  };

  const closeCompare = () => {
    setCompareOpen(false);
    setCompareList([]);
  };

  // Formatear Fecha
  const formatMatchDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  // Calcular puntos temporales si el partido terminó
  const points =
    match.status === 'finished' && userBet && match.scoreA !== null && match.scoreB !== null
      ? calculatePoints(userBet.predA, userBet.predB, match.scoreA, match.scoreB)
      : null;

  return (
    <>
      {/* Main Card */}
      <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 backdrop-blur-sm transition-all hover:border-zinc-700/60 shadow-lg">
        {/* Match Status Header */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-zinc-500 font-medium">
            {formatMatchDate(match.date)} hs
          </span>

          {match.status === 'live' && (
            <span className="flex items-center gap-1 text-[11px] font-bold text-red-500 bg-red-500/10 px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
              <span className="h-1.5 w-1.5 bg-red-500 rounded-full"></span>
              En Vivo
            </span>
          )}

          {match.status === 'finished' && (
            <span className="text-[11px] font-bold text-zinc-400 bg-zinc-800/80 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              Finalizado
            </span>
          )}

          {match.status === 'scheduled' && (
            <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
              locked ? 'text-red-400 bg-red-500/10' : 'text-emerald-400 bg-emerald-500/10'
            }`}>
              {locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
              {locked ? 'Cerrado' : 'Abierto'}
            </span>
          )}
        </div>

        {/* Teams and Score Grid */}
        <div className="grid grid-cols-7 gap-1 items-center mb-4">
          {/* Team A */}
          <div className="col-span-2 text-center flex flex-col items-center gap-1.5">
            <span className="text-3xl filter drop-shadow-md">{match.teamAFlag}</span>
            <span className="text-sm font-bold text-white truncate max-w-full">{match.teamA}</span>
          </div>

          {/* Score / Inputs */}
          <div className="col-span-3 flex justify-center items-center gap-2">
            {match.status === 'finished' || match.status === 'live' ? (
              <div className="flex items-center gap-2.5 bg-zinc-950/80 px-4 py-2.5 rounded-xl border border-zinc-800/50">
                <span className="text-2xl font-black text-white">{match.scoreA ?? 0}</span>
                <span className="text-zinc-600 font-bold text-sm">-</span>
                <span className="text-2xl font-black text-white">{match.scoreB ?? 0}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min="0"
                  value={predA}
                  disabled={locked}
                  onChange={(e) => setPredA(e.target.value)}
                  className="w-11 h-11 text-center bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white rounded-xl text-lg font-bold disabled:opacity-50 disabled:bg-zinc-900/60 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="-"
                />
                <span className="text-zinc-600 font-bold text-xs px-0.5">vs</span>
                <input
                  type="number"
                  min="0"
                  value={predB}
                  disabled={locked}
                  onChange={(e) => setPredB(e.target.value)}
                  className="w-11 h-11 text-center bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-white rounded-xl text-lg font-bold disabled:opacity-50 disabled:bg-zinc-900/60 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  placeholder="-"
                />
              </div>
            )}
          </div>

          {/* Team B */}
          <div className="col-span-2 text-center flex flex-col items-center gap-1.5">
            <span className="text-3xl filter drop-shadow-md">{match.teamBFlag}</span>
            <span className="text-sm font-bold text-white truncate max-w-full">{match.teamB}</span>
          </div>
        </div>

        {/* Bet Status and Actions */}
        <div className="pt-3.5 border-t border-zinc-800/60 flex items-center justify-between text-xs min-h-[40px] flex-wrap gap-2">
          {/* Left: Bet Info */}
          <div className="flex-1 min-w-[200px]">
            {match.status === 'finished' || match.status === 'live' ? (
              userBet ? (
                <span className="text-zinc-400">
                  Tu pronóstico: <strong className="text-white font-bold">{userBet.predA} - {userBet.predB}</strong>
                </span>
              ) : (
                <span className="text-zinc-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> No apostaste
                </span>
              )
            ) : userBet ? (
              <span className="text-emerald-400/90 flex items-center gap-1 font-semibold">
                <Check className="h-3.5 w-3.5" /> Guardado ({userBet.predA}-{userBet.predB})
              </span>
            ) : (
              <span className="text-zinc-500 italic">Pendiente de apuesta</span>
            )}
          </div>

          {/* Center/Right: Points or Save Button */}
          <div className="flex items-center gap-2">
            {match.status === 'finished' ? (
              points !== null ? (
                <span className={`font-black px-2.5 py-1 rounded-lg text-xs tracking-wider ${
                  points > 0
                    ? 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                    : 'text-zinc-500 bg-zinc-900 border border-zinc-800'
                }`}>
                  +{points} {points === 1 ? 'PUNTO' : 'PUNTOS'}
                </span>
              ) : (
                <span className="text-zinc-600">Sin puntos</span>
              )
            ) : match.status === 'scheduled' && !locked ? (
              <button
                onClick={handleSaveBet}
                disabled={loading || predA === '' || predB === ''}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/20 disabled:opacity-30 disabled:hover:bg-emerald-500/10 disabled:hover:text-emerald-400 font-bold transition-all text-xs active:scale-95"
              >
                {loading ? (
                  <RefreshCw className="h-3 w-3 animate-spin" />
                ) : success ? (
                  <Check className="h-3 w-3" />
                ) : (
                  'Guardar'
                )}
              </button>
            ) : null}

            <button
              onClick={() => openCompare()}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-semibold transition-all"
            >
              Comparar
            </button>
          </div>
        </div>
      </div>

      {/* Compare Modal */}
      {compareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Apuestas - {match.teamA} vs {match.teamB}</h3>
              <button onClick={closeCompare} className="text-zinc-400 hover:text-white text-xl">✕</button>
            </div>

            {compareLoading ? (
              <div className="flex items-center justify-center py-10">
                <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
              </div>
            ) : compareList.length === 0 ? (
              <div className="py-8 text-center text-zinc-400">No hay apuestas registradas.</div>
            ) : (
              <div className="space-y-3">
                {compareList.map((entry) => (
                  <div key={entry.bet.id} className="flex items-center gap-3 rounded-lg p-3 border border-zinc-800 bg-zinc-950/30">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      {entry.user.photoURL ? (
                        <img src={entry.user.photoURL} alt={entry.user.name} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-xs text-zinc-400">{entry.user.name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold text-white truncate">{entry.user.name}</div>
                        <div className="text-xs text-zinc-400 flex-shrink-0">{entry.user.points} pts</div>
                      </div>
                      <div className="text-sm text-zinc-300">
                        Pronóstico: <strong className="text-white">{entry.bet.predA}-{entry.bet.predB}</strong>
                      </div>
                      <div className="text-xs mt-1">
                        {entry.user.streak?.type ? (
                          <StreakBadge type={entry.user.streak.type} count={entry.user.streak.count} />
                        ) : (
                          <span className="text-zinc-500">Sin racha</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
