'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MatchCard } from '@/components/MatchCard';
import { Calendar, RefreshCw, AlertCircle, Play, Globe } from 'lucide-react';

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

export default function MatchesPage() {
  const { user, profile } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [bets, setBets] = useState<Record<string, Bet>>({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncAttempted, setSyncAttempted] = useState(false);

  // 1. Escuchar partidos en tiempo real
  useEffect(() => {
    const q = query(collection(db, 'matches'), orderBy('date', 'asc'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const matchesList: Match[] = [];
        snapshot.forEach((doc) => {
          matchesList.push({ id: doc.id, ...doc.data() } as Match);
        });
        setMatches(matchesList);
        setLoading(false);

        // Si no hay partidos, disparar sincronización automática una sola vez
        if (matchesList.length === 0 && !syncAttempted && !syncing) {
          setSyncAttempted(true);
          setSyncing(true);
          fetch('/api/world-cup-sync')
            .then(res => res.json())
            .then(data => console.log('Auto-sync:', data.message))
            .catch(err => console.error('Auto-sync error:', err))
            .finally(() => setSyncing(false));
        }
      },
      (error) => {
        console.error('Error fetching matches:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [syncAttempted, syncing]);

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

  // Separar partidos por día, solo hoy es apostable
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const tomorrowStart = new Date(todayEnd);
  const tomorrowEnd = new Date(tomorrowStart);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  const todayMatches = matches.filter(m => {
    const d = new Date(m.date);
    return d >= todayStart && d < todayEnd;
  });
  const tomorrowMatches = matches.filter(m => {
    const d = new Date(m.date);
    return d >= tomorrowStart && d < tomorrowEnd;
  });
  const futureMatches = matches.filter(m => {
    const d = new Date(m.date);
    return d >= tomorrowEnd;
  });

  if (loading) {
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
            Solo puedes apostar en los partidos de <strong className="text-emerald-400">Hoy</strong>. Los partidos futuros se cargan automáticamente para que los veas.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-center text-xs text-zinc-400 self-start sm:self-auto font-medium">
          Total partidos: <span className="text-emerald-400 font-bold">{matches.length}</span>
        </div>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/10 p-12 text-center">
          {syncing ? (
            <>
              <RefreshCw className="h-12 w-12 text-emerald-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-bold text-zinc-300">Sincronizando partidos...</h3>
              <p className="text-zinc-500 text-sm mt-2 max-w-sm mx-auto">
                Estamos cargando automáticamente los partidos del Mundial 2026 desde la fuente oficial. Un momento...
              </p>
            </>
          ) : (
            <>
              <Globe className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-zinc-300">No hay partidos disponibles</h3>
              <p className="text-zinc-500 text-sm mt-2 max-w-sm mx-auto">
                No se pudieron cargar los partidos automáticamente. El administrador debe sincronizar desde el panel de control.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-10">
          {sections.map(({ key, label, icon, matches: sectionMatches, isBettable }) => {
            if (sectionMatches.length === 0) return null;
            return (
              <div key={key} className="space-y-4">
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
                  {sectionMatches.map((match) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      userBet={bets[match.id]}
                      userId={user.uid}
                      userName={profile.name}
                      userPhoto={profile.photoURL}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
