'use client';

import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MatchCard } from '@/components/MatchCard';
import { Calendar, RefreshCw, AlertCircle, Play, Globe } from 'lucide-react';
import { fetchWorldCupData, processMatches, getSpanishName, isTeamDefined, type ProcessedMatch } from '@/lib/worldCupData';
import { motion } from 'framer-motion';

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

function apiMatchToMatchCard(m: ProcessedMatch): Match {
  return {
    id: m.id,
    teamA: getSpanishName(m.teamA),
    teamB: getSpanishName(m.teamB),
    teamAFlag: m.teamAFlag,
    teamBFlag: m.teamBFlag,
    date: m.date,
    scoreA: m.scoreA,
    scoreB: m.scoreB,
    status: m.status,
  };
}

export default function MatchesPage() {
  const { user, profile } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [bets, setBets] = useState<Record<string, Bet>>({});
  const [loading, setLoading] = useState(true);
  const [apiLoading, setApiLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const apiFetchedRef = useRef(false);

  // 1. Cargar partidos desde OpenFootball API (como la página mundial)
  useEffect(() => {
    if (apiFetchedRef.current) return;
    apiFetchedRef.current = true;

    const loadFromAPI = async () => {
      try {
        const raw = await fetchWorldCupData();
        if (raw && raw.matches) {
          const processed = processMatches(raw.matches);
          const defined = processed.filter(m => isTeamDefined(m.teamA) || isTeamDefined(m.teamB));
          const mapped = defined.map(apiMatchToMatchCard);
          setMatches(mapped);
        } else {
          setError('No se pudieron obtener datos del Mundial.');
        }
      } catch (e) {
        console.error('Error loading from API:', e);
        setError('Error al conectar con la fuente de datos.');
      } finally {
        setApiLoading(false);
        setLoading(false);
      }
    };

    loadFromAPI();
  }, []);

  // 2. Escuchar apuestas del usuario en tiempo real
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'bets'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const betsMap: Record<string, Bet> = {};
        snapshot.forEach((doc) => {
          const bet = doc.data() as Bet;
          betsMap[bet.matchId] = bet;
        });
        setBets(betsMap);
      },
      (error) => {
        console.error('Error fetching user bets:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Separar partidos por día
  const { todayMatches, tomorrowMatches, futureMatches } = useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);
    const tomorrowStart = new Date(todayEnd);
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    return {
      todayMatches: matches.filter(m => {
        const d = new Date(m.date);
        return d >= todayStart && d < todayEnd;
      }),
      tomorrowMatches: matches.filter(m => {
        const d = new Date(m.date);
        return d >= tomorrowStart && d < tomorrowEnd;
      }),
      futureMatches: matches.filter(m => {
        const d = new Date(m.date);
        return d >= tomorrowEnd;
      }),
    };
  }, [matches]);

  if (loading || apiLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-10 w-10 animate-spin text-emerald-400" />
          <p className="text-sm font-medium text-emerald-400/80 animate-pulse">Cargando partidos...</p>
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4 bg-zinc-950 text-white text-center">
        <div className="max-w-sm rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
          <AlertCircle className="h-12 w-12 text-amber-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold">Sesión requerida</h3>
          <p className="text-zinc-400 text-sm mt-2">Debes iniciar sesión para ver y realizar apuestas.</p>
        </div>
      </div>
    );
  }

  const sections: { key: string; label: string; icon: React.ReactNode; matches: Match[]; isBettable: boolean }[] = [
    { key: 'today', label: 'Hoy', icon: <Play className="h-4 w-4" />, matches: todayMatches, isBettable: true },
    { key: 'tomorrow', label: 'Mañana', icon: <Calendar className="h-4 w-4" />, matches: tomorrowMatches, isBettable: false },
    { key: 'future', label: 'Próximos Partidos', icon: <Calendar className="h-4 w-4" />, matches: futureMatches, isBettable: false },
  ];

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto space-y-8 bg-zinc-950 text-white min-h-[85vh]">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Partidos y Apuestas</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Solo puedes apostar en los partidos de <strong className="text-emerald-400">Hoy</strong>. Los partidos futuros se cargan automáticamente.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-center text-xs text-zinc-400 self-start sm:self-auto font-medium">
          Total partidos: <span className="text-emerald-400 font-bold">{matches.length}</span>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/10 p-12 text-center">
          <Globe className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-zinc-300">No hay partidos disponibles</h3>
          <p className="text-zinc-500 text-sm mt-2 max-w-sm mx-auto">
            No se pudieron cargar partidos. Intenta recargar la página o contacta al administrador.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {sections.map(({ key, label, icon, matches: sectionMatches, isBettable }) => {
            if (sectionMatches.length === 0) return null;
            return (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <h2 className={`text-lg font-black tracking-wide flex items-center gap-2 border-b pb-2 ${
                  isBettable ? 'text-emerald-400 border-emerald-500/30' : 'text-zinc-300 border-zinc-800/40'
                }`}>
                  {icon}
                  {label}
                  <span className={`text-[10px] font-bold ml-1 px-1.5 py-0.5 rounded-full ${
                    isBettable ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-500'
                  }`}>{sectionMatches.length}</span>
                  {!isBettable && (
                    <span className="text-[10px] text-zinc-500 font-normal ml-auto">Pre-cargado (solo vista)</span>
                  )}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sectionMatches.map((match, i) => (
                    <motion.div
                      key={match.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: i * 0.03 }}
                    >
                      <MatchCard
                        match={match}
                        userBet={bets[match.id]}
                        userId={user.uid}
                        userName={profile.name}
                        userPhoto={profile.photoURL}
                      />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
