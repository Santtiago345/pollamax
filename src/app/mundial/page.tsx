'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { fetchWorldCupData, processMatches, calculateGroupStandings, type ProcessedMatch, type GroupStandings } from '@/lib/worldCupData';
import { RefreshCw, Globe, Calendar, BarChart3, Trophy, GitBranchPlus, CheckCircle2, Clock, Play } from 'lucide-react';
import Link from 'next/link';

type TabId = 'today' | 'groups' | 'results' | 'bracket';

export default function MundialPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [matches, setMatches] = useState<ProcessedMatch[]>([]);
  const [groups, setGroups] = useState<GroupStandings[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await fetchWorldCupData();
      if (raw) {
        const processed = processMatches(raw.matches);
        const standings = calculateGroupStandings(processed);
        setMatches(processed);
        setGroups(standings);
        setLastSync(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (error) {
      console.error('Error loading World Cup data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filtros por tab
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

  const todayMatches = matches.filter(m => m.date.startsWith(todayStr));
  const finishedMatches = [...matches]
    .filter(m => m.status === 'finished')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const upcomingMatches = matches
    .filter(m => m.status === 'scheduled')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const tabs: { id: TabId; label: string; icon: React.ReactNode; count?: number }[] = [
    { id: 'today', label: 'Hoy', icon: <Calendar className="h-4 w-4" />, count: todayMatches.length + matches.filter(m => m.status === 'live').length },
    { id: 'groups', label: 'Grupos', icon: <BarChart3 className="h-4 w-4" />, count: groups.length },
    { id: 'results', label: 'Resultados', icon: <CheckCircle2 className="h-4 w-4" />, count: finishedMatches.length },
    { id: 'bracket', label: 'Llaves', icon: <GitBranchPlus className="h-4 w-4" /> },
  ];

  if (!user) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center text-center p-4 bg-zinc-950 text-white">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8">
          <Globe className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
          <h3 className="text-lg font-bold">Sesión requerida</h3>
          <p className="text-zinc-400 text-sm mt-2">Inicia sesión para ver la información del Mundial.</p>
          <Link href="/" className="mt-4 inline-block text-sm text-emerald-400 underline">Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 max-w-6xl mx-auto space-y-6 bg-zinc-950 text-white min-h-[85vh]">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Globe className="h-7 w-7 text-emerald-400" />
            Mundial 2026
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Datos en tiempo real. Grupos, resultados y llaves del torneo.
            {lastSync && <span className="text-zinc-500 ml-2">Última actualización: {lastSync}</span>}
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-zinc-700 bg-zinc-900/40 px-4 py-2.5 text-sm font-semibold text-zinc-300 hover:text-white hover:bg-zinc-900 transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* Tabs de Navegación */}
      <div className="flex items-center gap-1 bg-zinc-900/50 rounded-xl p-1 border border-zinc-800 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-bold transition-all flex-shrink-0 ${activeTab === tab.id
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-emerald-500/20 text-emerald-300' : 'bg-zinc-800 text-zinc-400'
                }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Contenido de los Tabs */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-400"></div>
            <p className="text-sm text-emerald-400/80 animate-pulse">Cargando datos del Mundial...</p>
          </div>
        </div>
      ) : (
        <>
          {/* TAB: HOY */}
          {activeTab === 'today' && (
            <TodayTab todayMatches={todayMatches} liveMatches={matches.filter(m => m.status === 'live')} upcomingMatches={upcomingMatches.slice(0, 10)} />
          )}

          {/* TAB: GRUPOS */}
          {activeTab === 'groups' && (
            <GroupsTab groups={groups} />
          )}

          {/* TAB: RESULTADOS */}
          {activeTab === 'results' && (
            <ResultsTab matches={finishedMatches} />
          )}

          {/* TAB: LLAVES */}
          {activeTab === 'bracket' && (
            <BracketTab groups={groups} />
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// Sub-componentes de Tabs
// ============================================================

function MatchRow({ match }: { match: ProcessedMatch }) {
  const matchDate = new Date(match.date);
  const timeStr = matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', hour12: false });
  const dateStr = matchDate.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const now = new Date();
  const minutesElapsed = Math.max(0, Math.floor((now.getTime() - matchDate.getTime()) / 60000));
  const isHalfTime = minutesElapsed >= 46 && minutesElapsed <= 60;

  return (
    <div className={`rounded-xl border px-4 py-3.5 flex items-center justify-between gap-4 transition-all hover:border-zinc-700/60 ${match.status === 'live'
        ? 'border-red-500/30 bg-red-500/5'
        : match.status === 'finished'
          ? 'border-zinc-800/50 bg-zinc-900/20'
          : 'border-zinc-800/80 bg-zinc-900/10'
      }`}>
      {/* Equipo A */}
      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
        <span className="font-bold text-sm text-white truncate text-right">{match.teamA}</span>
        <span className="text-2xl shrink-0">{match.teamAFlag}</span>
      </div>

      {/* Centro: Marcador o Hora */}
      <div className="text-center shrink-0 min-w-[90px]">
        {match.status === 'finished' ? (
          <div className="flex items-center gap-2 justify-center">
            <span className="text-xl font-black text-white">{match.scoreA}</span>
            <span className="text-zinc-600 font-bold">-</span>
            <span className="text-xl font-black text-white">{match.scoreB}</span>
          </div>
        ) : match.status === 'live' ? (
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">En Vivo</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-white">{match.scoreA ?? 0}</span>
              <span className="text-zinc-600">-</span>
              <span className="text-lg font-black text-white">{match.scoreB ?? 0}</span>
            </div>
            <div className="mt-1 text-xs text-zinc-300">
              {isHalfTime ? (
                <span className="text-sm font-bold text-zinc-300">Descanso</span>
              ) : (
                <span className="text-sm font-bold text-red-300">{minutesElapsed}'</span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <span className="text-sm font-black text-zinc-300">{timeStr}</span>
            <span className="text-[10px] text-zinc-500">{dateStr}</span>
          </div>
        )}
        {match.group && match.group.startsWith('Group') && (
          <div className="mt-1">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{match.group.replace('Group ', 'Gr. ')}</span>
          </div>
        )}
      </div>

      {/* Equipo B */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <span className="text-2xl shrink-0">{match.teamBFlag}</span>
        <span className="font-bold text-sm text-white truncate">{match.teamB}</span>
      </div>
    </div>
  );
}

function TodayTab({ todayMatches, liveMatches, upcomingMatches }: { todayMatches: ProcessedMatch[]; liveMatches: ProcessedMatch[]; upcomingMatches: ProcessedMatch[] }) {
  const allTodayAndLive = [...new Map([...liveMatches, ...todayMatches].map(m => [m.id, m])).values()];

  return (
    <div className="space-y-8">
      {/* Partidos del día / en vivo */}
      <div className="space-y-3">
        <h2 className="text-lg font-black text-white flex items-center gap-2 pb-2 border-b border-zinc-800/60">
          <Play className="h-5 w-5 text-red-400" />
          {allTodayAndLive.length > 0 ? 'Partidos de Hoy' : 'No hay partidos hoy'}
        </h2>
        {allTodayAndLive.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {allTodayAndLive.map(m => <MatchRow key={m.id} match={m} />)}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center text-zinc-500">
            <Calendar className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay partidos programados para hoy.</p>
          </div>
        )}
      </div>

      {/* Próximos Partidos */}
      {upcomingMatches.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-black text-white flex items-center gap-2 pb-2 border-b border-zinc-800/60">
            <Clock className="h-5 w-5 text-emerald-400" />
            Próximos Partidos
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {upcomingMatches.map(m => <MatchRow key={m.id} match={m} />)}
          </div>
        </div>
      )}
    </div>
  );
}

function GroupsTab({ groups }: { groups: GroupStandings[] }) {
  if (groups.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
        <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No hay datos de grupos disponibles. Haz clic en "Actualizar".</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {groups.map((group) => (
        <div key={group.group} className="rounded-2xl border border-zinc-800 bg-zinc-900/20 overflow-hidden shadow">
          {/* Header del Grupo */}
          <div className="px-4 py-3 bg-emerald-500/8 border-b border-zinc-800/70 flex justify-between items-center">
            <h3 className="font-black text-emerald-400 text-sm tracking-wider uppercase">{group.group.replace('Group ', 'Grupo ')}</h3>
            <span className="text-[10px] text-zinc-500 font-semibold uppercase">PJ PG PE PP GF GC DG Pts</span>
          </div>

          {/* Filas de Equipos */}
          <div className="divide-y divide-zinc-900/50">
            {group.teams.map((team, idx) => {
              const isClassified = idx < 3; // Top 3 clasifican al Ronda de 32
              const isBorderline = idx === 2;

              return (
                <div
                  key={team.team}
                  className={`flex items-center gap-2 px-4 py-2.5 text-xs transition-colors ${idx === 0 ? 'bg-amber-500/5' : idx === 1 ? 'bg-zinc-800/10' : idx === 2 ? 'bg-orange-500/5' : ''
                    }`}
                >
                  {/* Posición */}
                  <span className={`w-5 text-center font-black text-xs shrink-0 ${idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-orange-400' : 'text-zinc-600'
                    }`}>
                    {idx + 1}
                  </span>

                  {/* Bandera y Nombre */}
                  <span className="text-base shrink-0">{team.flag}</span>
                  <span className={`font-bold flex-1 min-w-0 truncate text-xs ${isClassified ? 'text-white' : 'text-zinc-400'}`}>
                    {team.team}
                  </span>

                  {/* Estadísticas */}
                  <div className="flex items-center gap-2.5 text-[10px] font-mono shrink-0 text-zinc-400">
                    <span className="w-4 text-center">{team.played}</span>
                    <span className="w-4 text-center">{team.won}</span>
                    <span className="w-4 text-center">{team.drawn}</span>
                    <span className="w-4 text-center">{team.lost}</span>
                    <span className="w-4 text-center">{team.goalsFor}</span>
                    <span className="w-4 text-center">{team.goalsAgainst}</span>
                    <span className={`w-5 text-center font-bold ${team.goalDiff > 0 ? 'text-emerald-400' : team.goalDiff < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                      {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
                    </span>
                    <span className={`w-5 text-center font-extrabold ${idx === 0 ? 'text-amber-400' : idx < 3 ? 'text-white' : 'text-zinc-400'
                      }`}>
                      {team.points}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-2 bg-zinc-900/30 text-[9px] text-zinc-600 text-center uppercase tracking-widest font-semibold border-t border-zinc-900">
            Top 3 clasifican a Ronda de 32
          </div>
        </div>
      ))}
    </div>
  );
}

function ResultsTab({ matches }: { matches: ProcessedMatch[] }) {
  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
        <CheckCircle2 className="h-10 w-10 mx-auto mb-3 opacity-30" />
        <p className="text-sm">No hay resultados disponibles aún.</p>
      </div>
    );
  }

  // Agrupar por fecha
  const byDate: Record<string, ProcessedMatch[]> = {};
  matches.forEach(m => {
    const d = new Date(m.date).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const key = d.charAt(0).toUpperCase() + d.slice(1);
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(m);
  });

  return (
    <div className="space-y-8">
      {Object.entries(byDate).map(([dateLabel, dayMatches]) => (
        <div key={dateLabel} className="space-y-3">
          <h2 className="text-sm font-black text-emerald-400 flex items-center gap-2 pb-2 border-b border-zinc-800/60 uppercase tracking-wider">
            <CheckCircle2 className="h-4 w-4" />
            {dateLabel}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dayMatches.map(m => <MatchRow key={m.id} match={m} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function BracketTab({ groups }: { groups: GroupStandings[] }) {
  // Construir clasificados proyectados según posiciones de grupos
  // En el Mundial 2026: 48 equipos, 12 grupos de 4, top 3 de cada grupo pasan (36 equipos)
  // + 8 mejores terceros = 32 → Ronda de 32 → Octavos → Cuartos → Semis → Final

  const classified: { pos: number; team: string; flag: string; group: string }[] = [];

  groups.forEach(g => {
    g.teams.slice(0, 3).forEach((t, idx) => {
      classified.push({ pos: idx + 1, team: t.team, flag: t.flag, group: g.group });
    });
  });

  const groupsWithData = groups.filter(g => g.teams.some(t => t.played > 0));
  const isGroupStageComplete = groupsWithData.length === 12 && groups.every(g => g.teams.every(t => t.played >= 3));

  return (
    <div className="space-y-8">
      {/* Indicador de estado */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 flex items-start gap-3">
        <GitBranchPlus className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-white">
            {isGroupStageComplete ? '🏆 Fase de Grupos Completada' : '📊 Proyección Dinámica de Clasificados'}
          </h4>
          <p className="text-xs text-zinc-400 mt-1">
            {isGroupStageComplete
              ? 'Los clasificados para la Ronda de 32 están confirmados.'
              : 'Basado en la posición actual de cada grupo (sujeta a cambios con los próximos partidos).'}
          </p>
        </div>
      </div>

      {/* Visualización conceptual de llaves (bracket) */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-white border-b border-zinc-800/60 pb-2">Llaves del Torneo (Proyección)</h2>
        <div className="overflow-x-auto">
          <div className="flex gap-6 py-4">
            {/* Ronda de 32 - Columna 1 */}
            <div className="flex flex-col gap-3 min-w-[220px]">
              <h4 className="text-sm font-bold text-zinc-300 mb-2">Ronda de 32</h4>
              {(function buildR32() {
                const slots: any[] = [];
                // Tomar top3 de cada grupo secuencialmente para llenar los primeros slots
                groups.forEach(g => {
                  const t = g.teams[0];
                  slots.push({ team: t?.team || '---', flag: t?.flag || '🏳️' });
                  const t2 = g.teams[1];
                  slots.push({ team: t2?.team || '---', flag: t2?.flag || '🏳️' });
                });
                // Asegurar al menos 32 slots llenando con placeholders
                while (slots.length < 32) slots.push({ team: 'TBD', flag: '🏳️' });
                return slots.slice(0, 32).map((s, i) => (
                  <div key={`r32-${i}`} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-900/20 border border-zinc-800">
                    <div className="text-xl">{s.flag}</div>
                    <div className="flex-1 text-sm font-semibold truncate">{s.team}</div>
                  </div>
                ));
              })()}
            </div>

            {/* Octavos */}
            <div className="flex flex-col gap-3 min-w-[220px]">
              <h4 className="text-sm font-bold text-zinc-300 mb-2">Octavos</h4>
              {Array.from({ length: 16 }).map((_, i) => (
                <div key={`r16-${i}`} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-900/10 border border-zinc-800">
                  <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs">{i+1}</div>
                  <div className="flex-1 text-sm text-zinc-400">Ganador Partido {i+1}</div>
                </div>
              ))}
            </div>

            {/* Cuartos */}
            <div className="flex flex-col gap-3 min-w-[220px]">
              <h4 className="text-sm font-bold text-zinc-300 mb-2">Cuartos</h4>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={`qf-${i}`} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-900/10 border border-zinc-800">
                  <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs">{i+1}</div>
                  <div className="flex-1 text-sm text-zinc-400">Ganador Octavos {i+1}</div>
                </div>
              ))}
            </div>

            {/* Semis */}
            <div className="flex flex-col gap-3 min-w-[220px]">
              <h4 className="text-sm font-bold text-zinc-300 mb-2">Semifinal</h4>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={`sf-${i}`} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-900/10 border border-zinc-800">
                  <div className="h-6 w-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs">{i+1}</div>
                  <div className="flex-1 text-sm text-zinc-400">Ganador Cuartos {i+1}</div>
                </div>
              ))}
            </div>

            {/* Final */}
            <div className="flex flex-col gap-3 min-w-[220px]">
              <h4 className="text-sm font-bold text-zinc-300 mb-2">Final</h4>
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-900/20 border border-zinc-800">
                <div className="text-xl">🏆</div>
                <div className="flex-1 text-sm font-semibold">Campeón (Proyección)</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner informativo de estructura del torneo */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/10 p-5 space-y-3">
        <h3 className="text-sm font-black text-zinc-300 uppercase tracking-wider">Estructura del Mundial 2026</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
          {[
            { round: 'Fase de Grupos', teams: '48', icon: '🏟️' },
            { round: 'Ronda de 32', teams: '32', icon: '⚽' },
            { round: 'Octavos', teams: '16', icon: '🎯' },
            { round: 'Cuartos', teams: '8', icon: '⚡' },
            { round: 'Semis', teams: '4', icon: '🔥' },
            { round: 'Tercer Puesto', teams: '2', icon: '🥉' },
            { round: 'FINAL', teams: '2', icon: '🏆' },
          ].map(r => (
            <div key={r.round} className="rounded-lg bg-zinc-900/40 border border-zinc-800/50 p-2.5">
              <div className="text-2xl mb-1">{r.icon}</div>
              <div className="font-bold text-white text-[11px]">{r.round}</div>
              <div className="text-zinc-500 text-[10px]">{r.teams} equipos</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
