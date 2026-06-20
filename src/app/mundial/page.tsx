'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { fetchWorldCupData, processMatches, calculateGroupStandings, type ProcessedMatch, type GroupStandings, type GroupTeamStats } from '@/lib/worldCupData';
import { RefreshCw, Globe, Calendar, BarChart3, Trophy, GitBranchPlus, CheckCircle2, Clock, Play, MapPin } from 'lucide-react';
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

// ============================================================
// Configuración del bracket del Mundial 2026
// ============================================================

interface BracketSlot {
  code: string;       // ej: "1A", "2B", "3ABCDF", "W73", "L101"
  label: string;      // ej: "1° Grupo A", "2° Grupo B", "Mejor 3° (A,B,C,D,F)"
}

interface KnockoutMatch {
  id: string;
  venue: string;
  slots: [BracketSlot, BracketSlot];
}

const R32_MATCHES: KnockoutMatch[] = [
  { id: 'M73', venue: 'Toronto',   slots: [{ code: '2A', label: '2° Grupo A' }, { code: '2B', label: '2° Grupo B' }] },
  { id: 'M74', venue: 'Atlanta',   slots: [{ code: '1E', label: '1° Grupo E' }, { code: '3ABCDF', label: 'Mejor 3° (A,B,C,D,F)' }] },
  { id: 'M75', venue: 'Vancouver', slots: [{ code: '1F', label: '1° Grupo F' }, { code: '2C', label: '2° Grupo C' }] },
  { id: 'M76', venue: 'Los Ángeles', slots: [{ code: '1C', label: '1° Grupo C' }, { code: '2F', label: '2° Grupo F' }] },
  { id: 'M77', venue: 'Nueva York/NJ', slots: [{ code: '1I', label: '1° Grupo I' }, { code: '3CDFGH', label: 'Mejor 3° (C,D,F,G,H)' }] },
  { id: 'M78', venue: 'San Francisco', slots: [{ code: '2E', label: '2° Grupo E' }, { code: '2I', label: '2° Grupo I' }] },
  { id: 'M79', venue: 'Ciudad de México', slots: [{ code: '1A', label: '1° Grupo A' }, { code: '3CEFHI', label: 'Mejor 3° (C,E,F,H,I)' }] },
  { id: 'M80', venue: 'Boston',    slots: [{ code: '1L', label: '1° Grupo L' }, { code: '3EHIJK', label: 'Mejor 3° (E,H,I,J,K)' }] },
  { id: 'M81', venue: 'Dallas',    slots: [{ code: '1D', label: '1° Grupo D' }, { code: '3BEFIJ', label: 'Mejor 3° (B,E,F,I,J)' }] },
  { id: 'M82', venue: 'Monterrey', slots: [{ code: '1G', label: '1° Grupo G' }, { code: '3AEHIJ', label: 'Mejor 3° (A,E,H,I,J)' }] },
  { id: 'M83', venue: 'Filadelfia', slots: [{ code: '2K', label: '2° Grupo K' }, { code: '2L', label: '2° Grupo L' }] },
  { id: 'M84', venue: 'Miami',     slots: [{ code: '1H', label: '1° Grupo H' }, { code: '2J', label: '2° Grupo J' }] },
  { id: 'M85', venue: 'Guadalajara', slots: [{ code: '1B', label: '1° Grupo B' }, { code: '3EFGIJ', label: 'Mejor 3° (E,F,G,I,J)' }] },
  { id: 'M86', venue: 'Houston',   slots: [{ code: '1J', label: '1° Grupo J' }, { code: '2H', label: '2° Grupo H' }] },
  { id: 'M87', venue: 'Kansas City', slots: [{ code: '1K', label: '1° Grupo K' }, { code: '3DEIJL', label: 'Mejor 3° (D,E,I,J,L)' }] },
  { id: 'M88', venue: 'Seattle',   slots: [{ code: '2D', label: '2° Grupo D' }, { code: '2G', label: '2° Grupo G' }] },
];

const R16_MATCHES: KnockoutMatch[] = [
  { id: 'M89', venue: 'Atlanta',          slots: [{ code: 'W74', label: 'Ganador M74' }, { code: 'W77', label: 'Ganador M77' }] },
  { id: 'M90', venue: 'Toronto',          slots: [{ code: 'W73', label: 'Ganador M73' }, { code: 'W75', label: 'Ganador M75' }] },
  { id: 'M91', venue: 'Los Ángeles',      slots: [{ code: 'W76', label: 'Ganador M76' }, { code: 'W78', label: 'Ganador M78' }] },
  { id: 'M92', venue: 'Ciudad de México', slots: [{ code: 'W79', label: 'Ganador M79' }, { code: 'W80', label: 'Ganador M80' }] },
  { id: 'M93', venue: 'Filadelfia',       slots: [{ code: 'W83', label: 'Ganador M83' }, { code: 'W84', label: 'Ganador M84' }] },
  { id: 'M94', venue: 'Dallas',           slots: [{ code: 'W81', label: 'Ganador M81' }, { code: 'W82', label: 'Ganador M82' }] },
  { id: 'M95', venue: 'Houston',          slots: [{ code: 'W86', label: 'Ganador M86' }, { code: 'W88', label: 'Ganador M88' }] },
  { id: 'M96', venue: 'Kansas City',      slots: [{ code: 'W85', label: 'Ganador M85' }, { code: 'W87', label: 'Ganador M87' }] },
];

const QF_MATCHES: KnockoutMatch[] = [
  { id: 'M97',  venue: 'Vancouver',       slots: [{ code: 'W89', label: 'Ganador M89' }, { code: 'W90', label: 'Ganador M90' }] },
  { id: 'M98',  venue: 'Nueva York/NJ',   slots: [{ code: 'W93', label: 'Ganador M93' }, { code: 'W94', label: 'Ganador M94' }] },
  { id: 'M99',  venue: 'Miami',           slots: [{ code: 'W91', label: 'Ganador M91' }, { code: 'W92', label: 'Ganador M92' }] },
  { id: 'M100', venue: 'Boston',          slots: [{ code: 'W95', label: 'Ganador M95' }, { code: 'W96', label: 'Ganador M96' }] },
];

const SF_MATCHES: KnockoutMatch[] = [
  { id: 'M101', venue: 'Dallas',          slots: [{ code: 'W97', label: 'Ganador M97' }, { code: 'W98', label: 'Ganador M98' }] },
  { id: 'M102', venue: 'Atlanta',         slots: [{ code: 'W99', label: 'Ganador M99' }, { code: 'W100', label: 'Ganador M100' }] },
];

const THIRD_MATCH: KnockoutMatch[] = [
  { id: 'M103', venue: 'Miami',           slots: [{ code: 'L101', label: 'Perdedor Semifinal 1' }, { code: 'L102', label: 'Perdedor Semifinal 2' }] },
];

const FINAL_MATCH: KnockoutMatch[] = [
  { id: 'M104', venue: 'East Rutherford', slots: [{ code: 'W101', label: 'Ganador Semifinal 1' }, { code: 'W102', label: 'Ganador Semifinal 2' }] },
];

const BEST_THIRD_SETS: Record<string, string[]> = {
  '3ABCDF': ['A','B','C','D','F'],
  '3CDFGH': ['C','D','F','G','H'],
  '3CEFHI': ['C','E','F','H','I'],
  '3EHIJK': ['E','H','I','J','K'],
  '3BEFIJ': ['B','E','F','I','J'],
  '3AEHIJ': ['A','E','H','I','J'],
  '3EFGIJ': ['E','F','G','I','J'],
  '3DEIJL': ['D','E','I','J','L'],
};

// ============================================================
// Lógica de resolución del bracket
// ============================================================

interface TeamInfo {
  name: string;
  flag: string;
}

function getGroupLetter(groupName: string): string {
  return groupName.replace('Group ', '');
}

function getPositionInGroup(groups: GroupStandings[], groupLetter: string, pos: 1 | 2 | 3): TeamInfo | null {
  const g = groups.find(gr => getGroupLetter(gr.group) === groupLetter);
  if (!g || !g.teams[pos - 1]) return null;
  return { name: g.teams[pos - 1].team, flag: g.teams[pos - 1].flag };
}

function getBestThirdFromSet(groups: GroupStandings[], groupLetters: string[]): TeamInfo | null {
  const candidates: { team: GroupTeamStats; groupLetter: string }[] = [];
  for (const letter of groupLetters) {
    const g = groups.find(gr => getGroupLetter(gr.group) === letter);
    if (g && g.teams[2]) {
      candidates.push({ team: g.teams[2], groupLetter: letter });
    }
  }
  candidates.sort((a, b) =>
    b.team.points - a.team.points ||
    b.team.goalDiff - a.team.goalDiff ||
    b.team.goalsFor - a.team.goalsFor
  );
  return candidates.length > 0 ? { name: candidates[0].team.team, flag: candidates[0].team.flag } : null;
}

function resolveSlot(slotCode: string, groups: GroupStandings[], matchResults: Map<string, string>): TeamInfo | null {
  // Patrón: "1A", "2B", "3C" (posición fija en grupo)
  const posMatch = slotCode.match(/^([123])([A-L])$/);
  if (posMatch) {
    const pos = parseInt(posMatch[1]) as 1 | 2 | 3;
    return getPositionInGroup(groups, posMatch[2], pos);
  }
  // Patrón: "3ABCDF" (mejor tercero de set de grupos)
  if (slotCode.startsWith('3') && slotCode.length > 2) {
    const setKey = slotCode;
    const letters = BEST_THIRD_SETS[setKey];
    if (letters) return getBestThirdFromSet(groups, letters);
  }
  // Patrón: "W73" (ganador de partido M73)
  const wMatch = slotCode.match(/^W(\d+)$/);
  if (wMatch) {
    const winner = matchResults.get(`M${wMatch[1]}`);
    if (winner) return { name: winner, flag: '🏳️' };
    return null;
  }
  // Patrón: "L101" (perdedor de partido)
  const lMatch = slotCode.match(/^L(\d+)$/);
  if (lMatch) {
    // No podemos saber quién perdió sin datos reales
    return null;
  }
  return null;
}

interface FilledMatch {
  id: string;
  venue: string;
  teamA: TeamInfo | null;
  teamB: TeamInfo | null;
  slotA: string;
  slotB: string;
  labelA: string;
  labelB: string;
}

function fillBracketMatch(m: KnockoutMatch, groups: GroupStandings[], results: Map<string, string>): FilledMatch {
  return {
    id: m.id,
    venue: m.venue,
    teamA: resolveSlot(m.slots[0].code, groups, results),
    teamB: resolveSlot(m.slots[1].code, groups, results),
    slotA: m.slots[0].code,
    slotB: m.slots[1].code,
    labelA: m.slots[0].label,
    labelB: m.slots[1].label,
  };
}

function fillRound(matches: KnockoutMatch[], groups: GroupStandings[], results: Map<string, string>): FilledMatch[] {
  return matches.map(m => fillBracketMatch(m, groups, results));
}

// ============================================================
// Sub-componentes del bracket visual
// ============================================================

function BracketMatchCard({ match, isWinner, showVenue }: { match: FilledMatch; isWinner?: boolean; showVenue?: boolean }) {
  const getBg = (team: TeamInfo | null, code: string) => {
    if (team) return code.startsWith('3') ? 'border-orange-500/30 bg-orange-500/5' : 'border-emerald-500/30 bg-emerald-500/5';
    return 'border-zinc-800 bg-zinc-900/20';
  };

  const getTeamDisplay = (team: TeamInfo | null, slot: string, label: string) => {
    if (team) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{team.flag}</span>
          <span className="font-semibold text-sm text-white truncate">{team.name}</span>
        </div>
      );
    }
    const isThird = slot.startsWith('3');
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg shrink-0">🏳️</span>
        <div className="flex flex-col min-w-0">
          <span className="text-xs text-zinc-500 font-medium truncate">Por definir</span>
          <span className="text-[10px] text-zinc-600 truncate">{label}</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative rounded-xl border p-3 transition-all ${isWinner ? 'border-amber-500/40 bg-amber-500/5 shadow-sm shadow-amber-500/10' : 'border-zinc-800 bg-zinc-900/20'}`}>
      {showVenue && (
        <div className="flex items-center gap-1 mb-2 text-[10px] text-zinc-500">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{match.venue}</span>
        </div>
      )}
      <div className="space-y-1.5">
        <div className={`rounded-lg px-2.5 py-1.5 border ${getBg(match.teamA, match.slotA)}`}>
          {getTeamDisplay(match.teamA, match.slotA, match.labelA)}
        </div>
        <div className="flex items-center gap-1.5 px-1">
          <div className="flex-1 h-px bg-zinc-700/50"></div>
          <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider">vs</span>
          <div className="flex-1 h-px bg-zinc-700/50"></div>
        </div>
        <div className={`rounded-lg px-2.5 py-1.5 border ${getBg(match.teamB, match.slotB)}`}>
          {getTeamDisplay(match.teamB, match.slotB, match.labelB)}
        </div>
      </div>
      <div className="mt-1.5 text-center">
        <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-wider">{match.id}</span>
      </div>
    </div>
  );
}

function BracketColumn({ title, matches, isWinner, showVenue }: { title: string; matches: FilledMatch[]; isWinner?: boolean; showVenue?: boolean }) {
  return (
    <div className="flex flex-col gap-3 min-w-[200px]">
      <h4 className="text-sm font-bold text-zinc-300 mb-1 sticky left-0">{title}</h4>
      {matches.map((m, i) => (
        <BracketMatchCard key={m.id} match={m} isWinner={isWinner} showVenue={showVenue} />
      ))}
    </div>
  );
}

// ============================================================
// Componente principal de Llaves
// ============================================================

function BracketTab({ groups }: { groups: GroupStandings[] }) {
  const results = new Map<string, string>(); // matchId -> winner team name

  const r32 = fillRound(R32_MATCHES, groups, results);
  const r16 = fillRound(R16_MATCHES, groups, results);
  const qf = fillRound(QF_MATCHES, groups, results);
  const sf = fillRound(SF_MATCHES, groups, results);
  const third = fillRound(THIRD_MATCH, groups, results);
  const final = fillRound(FINAL_MATCH, groups, results);

  const totalTeams = groups.reduce((acc, g) => acc + g.teams.length, 0);
  const hasGroupData = totalTeams > 0;

  const groupsWithData = groups.filter(g => g.teams.some(t => t.played > 0));
  const isGroupStageComplete = groupsWithData.length === 12 && groups.every(g => g.teams.every(t => t.played >= 3));

  // Obtener mejores terceros proyectados para el panel de información
  const allThirdPlaced = groups.map(g => ({
    team: g.teams[2],
    group: getGroupLetter(g.group),
  })).filter(t => t.team).sort((a, b) =>
    (b.team?.points ?? 0) - (a.team?.points ?? 0) ||
    (b.team?.goalDiff ?? 0) - (a.team?.goalDiff ?? 0) ||
    (b.team?.goalsFor ?? 0) - (a.team?.goalsFor ?? 0)
  );

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
              : 'Basado en la posición actual de cada grupo. Las llaves se actualizan automáticamente.'}
          </p>
        </div>
      </div>

      {!hasGroupData ? (
        <div className="rounded-xl border border-dashed border-zinc-800 p-12 text-center text-zinc-500">
          <GitBranchPlus className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay datos de fase de grupos. Haz clic en &quot;Actualizar&quot; para cargar los partidos.</p>
        </div>
      ) : (
        <>
          {/* Panel de Mejores Terceros */}
          <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
            <h4 className="text-sm font-bold text-orange-300 flex items-center gap-2 mb-2">
              <Trophy className="h-4 w-4" />
              Mejores Terceros (8 de 12 grupos clasifican)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {allThirdPlaced.slice(0, 8).map((t, i) => (
                <div key={t.group} className="flex items-center gap-1.5 bg-orange-500/10 rounded-lg px-2.5 py-1.5 border border-orange-500/15">
                  <span className="font-bold text-orange-400 text-[10px]">#{i + 1}</span>
                  <span className="text-sm">{t.team?.flag ?? '🏳️'}</span>
                  <span className="font-medium text-white truncate">{t.team?.team ?? 'TBD'}</span>
                  <span className="text-zinc-500 ml-auto">{t.team?.points ?? 0} pts</span>
                </div>
              ))}
              {allThirdPlaced.slice(8).map((t, i) => (
                <div key={t.group} className="flex items-center gap-1.5 bg-zinc-900/30 rounded-lg px-2.5 py-1.5 border border-zinc-800">
                  <span className="font-bold text-zinc-600 text-[10px]">#{i + 9}</span>
                  <span className="text-sm opacity-40">{t.team?.flag ?? '🏳️'}</span>
                  <span className="font-medium text-zinc-500 truncate">{t.team?.team ?? 'TBD'}</span>
                  <span className="text-zinc-600 ml-auto">{t.team?.points ?? 0} pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Visualización del bracket en árbol clásico */}
          <div className="overflow-x-auto pb-8">
            <div className="flex gap-4" style={{ minWidth: '1100px' }}>
              {/* Ronda de 32 */}
              <BracketColumn title="Ronda de 32 (16)" matches={r32} showVenue />

              {/* Octavos */}
              <div className="flex flex-col gap-3 min-w-[200px]">
                <h4 className="text-sm font-bold text-zinc-300 mb-1">Octavos (8)</h4>
                {r16.map((m, i) => (
                  <div key={m.id} className="relative">
                    {/* Línea conectora desde R32 */}
                    <div className="absolute -left-4 top-1/2 w-4 h-px border-t border-dashed border-zinc-700/40"></div>
                    <BracketMatchCard match={m} showVenue />
                  </div>
                ))}
              </div>

              {/* Cuartos */}
              <div className="flex flex-col gap-3 min-w-[200px]">
                <h4 className="text-sm font-bold text-zinc-300 mb-1">Cuartos (4)</h4>
                {qf.map((m, i) => (
                  <div key={m.id} className="relative">
                    <div className="absolute -left-4 top-1/2 w-4 h-px border-t border-dashed border-zinc-700/40"></div>
                    <BracketMatchCard match={m} showVenue />
                  </div>
                ))}
              </div>

              {/* Semifinales */}
              <div className="flex flex-col gap-3 min-w-[200px]">
                <h4 className="text-sm font-bold text-zinc-300 mb-1">Semifinal (2)</h4>
                {sf.map((m, i) => (
                  <div key={m.id} className="relative">
                    <div className="absolute -left-4 top-1/2 w-4 h-px border-t border-dashed border-zinc-700/40"></div>
                    <BracketMatchCard match={m} showVenue />
                  </div>
                ))}
              </div>

              {/* Final y Tercer Lugar */}
              <div className="flex flex-col gap-3 min-w-[200px]">
                <h4 className="text-sm font-bold text-zinc-300 mb-1">Final</h4>
                {final.map((m, i) => (
                  <div key={m.id} className="relative">
                    <div className="absolute -left-4 top-1/2 w-4 h-px border-t border-dashed border-zinc-700/40"></div>
                    <BracketMatchCard match={m} showVenue />
                  </div>
                ))}
                <h4 className="text-sm font-bold text-zinc-500 mt-4 mb-1">3er Lugar</h4>
                {third.map((m, i) => (
                  <div key={m.id} className="relative">
                    <div className="absolute -left-4 top-1/2 w-4 h-px border-t border-dashed border-zinc-700/40"></div>
                    <BracketMatchCard match={m} showVenue />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Leyenda de origen de llaves */}
          <details className="rounded-xl border border-zinc-800 bg-zinc-900/10">
            <summary className="px-5 py-3 text-sm font-bold text-zinc-300 cursor-pointer hover:text-white transition-colors">
              📖 Explicación de los emparejamientos
            </summary>
            <div className="px-5 pb-5 space-y-3 text-xs text-zinc-400">
              <p>El Mundial 2026 tiene <strong className="text-white">48 equipos</strong> divididos en <strong className="text-white">12 grupos de 4</strong>. Los <strong className="text-white">3 primeros</strong> de cada grupo (36 equipos) + los <strong className="text-white">8 mejores terceros</strong> clasifican a la Ronda de 32.</p>
              <p>Los cruces de la Ronda de 32 están predefinidos por la FIFA según la siguiente estructura:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {R32_MATCHES.map(m => (
                  <div key={m.id} className="flex items-center gap-2 bg-zinc-900/30 rounded-lg px-3 py-2 border border-zinc-800/50">
                    <span className="font-bold text-zinc-500 text-[10px] w-8">{m.id}</span>
                    <MapPin className="h-3 w-3 text-zinc-600" />
                    <span className="text-zinc-500 w-20 truncate">{m.venue}</span>
                    <span className="text-white">{m.slots[0].label}</span>
                    <span className="text-zinc-600">vs</span>
                    <span className="text-white">{m.slots[1].label}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2">Los <strong className="text-white">mejores terceros</strong> se asignan a cruces específicos según el grupo de origen, siguiendo el reglamento FIFA 2026. Las posiciones se ordenan por: puntos, diferencia de goles, goles a favor.</p>
            </div>
          </details>
        </>
      )}
    </div>
  );
}
