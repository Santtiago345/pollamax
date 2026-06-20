'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { MatchCard } from '@/components/MatchCard';
import { Calendar, RefreshCw, AlertCircle } from 'lucide-react';

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
      },
      (error) => {
        console.error('Error fetching matches:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
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

  // Agrupar partidos por día
  const groupMatchesByDay = (matchesList: Match[]) => {
    const groups: Record<string, Match[]> = {};
    matchesList.forEach((match) => {
      // Formatear la fecha como "Lunes 22 de Junio" o similar
      const d = new Date(match.date);
      const dayLabel = d.toLocaleDateString('es-ES', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      // Capitalizar la primera letra
      const capitalizedLabel = dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1);
      
      if (!groups[capitalizedLabel]) {
        groups[capitalizedLabel] = [];
      }
      groups[capitalizedLabel].push(match);
    });
    return groups;
  };

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

  const groupedMatches = groupMatchesByDay(matches);
  const totalMatches = matches.length;

  return (
    <div className="py-6 px-4 max-w-4xl mx-auto space-y-8 bg-zinc-950 text-white min-h-[85vh]">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Partidos y Apuestas</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Ingresa tus predicciones de los goles para cada partido. Se cierran 5 minutos antes del partido.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-2 text-center text-xs text-zinc-400 self-start sm:self-auto font-medium">
          Total partidos: <span className="text-emerald-400 font-bold">{totalMatches}</span>
        </div>
      </div>

      {totalMatches === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/10 p-12 text-center">
          <Calendar className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-zinc-300">No hay partidos creados</h3>
          <p className="text-zinc-500 text-sm mt-2 max-w-sm mx-auto">
            El administrador del torneo aún no ha cargado partidos. Vuelve a consultar más tarde para hacer tus predicciones.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {Object.entries(groupedMatches).map(([dayLabel, dayMatches]) => (
            <div key={dayLabel} className="space-y-4">
              <h2 className="text-lg font-black tracking-wide text-emerald-400 flex items-center gap-2 border-b border-zinc-800/40 pb-2">
                <Calendar className="h-4 w-4" />
                {dayLabel}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dayMatches.map((match) => (
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
          ))}
        </div>
      )}
    </div>
  );
}
