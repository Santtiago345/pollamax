'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { fetchWorldCupData, processMatches, calculateGroupStandings, detectMatchChanges, getSpanishName, type ProcessedMatch, type GroupStandings, type GroupTeamStats, type MatchChange } from '@/lib/worldCupData';
import { RefreshCw, Globe, Calendar, BarChart3, Trophy, GitBranchPlus, CheckCircle2, Clock, Play, MapPin, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

type TabId = 'today' | 'groups' | 'results' | 'bracket';

export default function MundialPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const [matches, setMatches] = useState<ProcessedMatch[]>([]);
  const [groups, setGroups] = useState<GroupStandings[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [events, setEvents] = useState<MatchChange[]>([]);
  const [syncingMatch, setSyncingMatch] = useState(false);
  const prevMatchesRef = useRef<ProcessedMatch[]>([]);

  const loadData = useCallback(async () => {
    try {
      const raw = await fetchWorldCupData();
      if (raw) {
        const processed = processMatches(raw.matches);
        const standings = calculateGroupStandings(processed);

        if (prevMatchesRef.current.length > 0) {
          const changes = detectMatchChanges(prevMatchesRef.current, processed);
          if (changes.length > 0) {
            setEvents(prev => [...changes, ...prev].slice(0, 20));
            const finished = changes.filter(c => c.type === 'finished');
            if (finished.length > 0 && !syncingMatch) {
              setSyncingMatch(true);
              try {
                const res = await fetch('/api/world-cup-sync');
                const data = await res.json();
                console.log('Auto-sync result:', data.message);
              } catch (e) {
                console.error('Sync error:', e);
              } finally {
                setSyncingMatch(false);
              }
            }
          }
        }

        prevMatchesRef.current = processed;
        setMatches(processed);
        setGroups(standings);
        setLastSync(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (error) {
      console.error('Error loading World Cup data:', error);
    } finally {
      setLoading(false);
    }
  }, [syncingMatch]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEvents(prev => prev.filter((_, i) => i < 10));
    }, 10000);
    return () => clearInterval(interval);
  }, []);

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

      {/* Eventos en vivo (notificaciones de goles, finales, etc.) */}
      <AnimatePresence>
        {events.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 max-h-[160px] overflow-y-auto rounded-xl border border-red-500/20 bg-red-500/5 p-3">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-400 mb-1">
                <Bell className="h-3.5 w-3.5 animate-pulse" />
                Eventos en vivo
              </div>
              <AnimatePresence initial={false}>
                {events.map((ev, i) => (
                  <motion.div
                    key={`${ev.matchId}-${ev.type}-${i}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`text-xs py-1 px-2 rounded-lg ${
                      ev.type === 'goal' ? 'bg-red-500/10 text-red-300 font-semibold' :
                      ev.type === 'finished' ? 'bg-emerald-500/10 text-emerald-300 font-semibold' :
                      ev.type === 'went_live' ? 'bg-red-500/5 text-red-400' :
                      'bg-amber-500/10 text-amber-300'
                    }`}
                  >
                    {ev.message}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
  const isHalfTime = match.status === 'live' && match.minutes >= 46 && match.minutes <= 60;
  const isExtraTime = match.status === 'live' && match.minutes > 90;

  return (
    <motion.div
      layout
      className={`rounded-xl border px-4 py-3.5 flex items-center justify-between gap-4 transition-all hover:border-zinc-700/60 ${
        match.status === 'live'
          ? 'border-red-500/30 bg-red-500/5'
          : match.status === 'finished'
            ? 'border-zinc-800/50 bg-zinc-900/20'
            : 'border-zinc-800/80 bg-zinc-900/10'
      }`}
    >
      {/* Equipo A */}
      <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
        <span className="font-bold text-sm text-white truncate text-right">{getSpanishName(match.teamA)}</span>
        <span className="text-2xl shrink-0">{match.teamAFlag}</span>
      </div>

      {/* Centro: Marcador o Hora */}
      <div className="text-center shrink-0 min-w-[90px]">
        {match.status === 'finished' ? (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            className="flex items-center gap-2 justify-center"
          >
            <span className="text-xl font-black text-white">{match.scoreA}</span>
            <span className="text-zinc-600 font-bold">-</span>
            <span className="text-xl font-black text-white">{match.scoreB}</span>
          </motion.div>
        ) : match.status === 'live' ? (
          <div className="flex flex-col items-center gap-0.5">
            <div className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
              <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                {isHalfTime ? 'Descanso' : isExtraTime ? 'T.E.' : 'En Vivo'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <motion.span
                key={`${match.id}-a-${match.scoreA}`}
                initial={{ scale: 1.4, color: '#fbbf24' }}
                animate={{ scale: 1, color: '#ffffff' }}
                transition={{ duration: 0.5 }}
                className="text-lg font-black text-white"
              >
                {match.scoreA ?? 0}
              </motion.span>
              <span className="text-zinc-600">-</span>
              <motion.span
                key={`${match.id}-b-${match.scoreB}`}
                initial={{ scale: 1.4, color: '#fbbf24' }}
                animate={{ scale: 1, color: '#ffffff' }}
                transition={{ duration: 0.5 }}
                className="text-lg font-black text-white"
              >
                {match.scoreB ?? 0}
              </motion.span>
            </div>
            <div className="mt-0.5 text-xs text-zinc-300">
              {!isHalfTime && (
                <span className="text-sm font-bold text-red-300">{match.minutes}'</span>
              )}
              {isHalfTime && match.scoreAHt !== null && (
                <span className="text-xs text-zinc-400">
                  Descanso: {match.scoreAHt}-{match.scoreBHt}
                </span>
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
        <span className="font-bold text-sm text-white truncate">{getSpanishName(match.teamB)}</span>
      </div>
    </motion.div>
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
          <div className="px-4 py-2 bg-emerald-500/8 border-b border-zinc-800/70">
            <div className="flex items-center">
              <h3 className="font-black text-emerald-400 text-sm tracking-wider uppercase flex-1">{group.group.replace('Group ', 'Grupo ')}</h3>
              <div className="grid grid-cols-8 gap-0 text-[9px] text-zinc-500 font-semibold uppercase text-center" style={{ minWidth: 200 }}>
                <span>PJ</span><span>PG</span><span>PE</span><span>PP</span><span>GF</span><span>GC</span><span>DG</span><span>Pts</span>
              </div>
            </div>
          </div>

          {/* Filas de Equipos - usando grid para alinear columnas */}
          <div className="divide-y divide-zinc-900/50">
            {group.teams.map((team, idx) => {
              const isClassified = idx < 3;

              return (
                <div
                  key={team.team}
                  className={`grid grid-cols-[auto_auto_1fr_auto] items-center gap-1.5 px-3 py-2.5 text-xs transition-colors ${
                    idx === 0 ? 'bg-amber-500/5' : idx === 1 ? 'bg-zinc-800/10' : idx === 2 ? 'bg-orange-500/5' : ''
                  }`}
                >
                  {/* Posición */}
                  <span className={`w-5 text-center font-black text-xs shrink-0 ${
                    idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-orange-400' : 'text-zinc-600'
                  }`}>
                    {idx + 1}
                  </span>

                  {/* Bandera */}
                  <span className="text-base shrink-0">{team.flag}</span>

                  {/* Nombre */}
                  <span className={`font-bold truncate text-xs ${isClassified ? 'text-white' : 'text-zinc-400'}`}>
                    {getSpanishName(team.team)}
                  </span>

                  {/* Estadísticas en grid interno */}
                  <div className="grid grid-cols-8 gap-0 text-[11px] font-mono text-center" style={{ minWidth: 200 }}>
                    <span className="text-zinc-400">{team.played}</span>
                    <span className="text-zinc-400">{team.won}</span>
                    <span className="text-zinc-400">{team.drawn}</span>
                    <span className="text-zinc-400">{team.lost}</span>
                    <span className="text-zinc-400">{team.goalsFor}</span>
                    <span className="text-zinc-400">{team.goalsAgainst}</span>
                    <span className={`font-bold ${team.goalDiff > 0 ? 'text-emerald-400' : team.goalDiff < 0 ? 'text-red-400' : 'text-zinc-400'}`}>
                      {team.goalDiff > 0 ? `+${team.goalDiff}` : team.goalDiff}
                    </span>
                    <span className={`font-extrabold text-sm ${idx === 0 ? 'text-amber-400' : idx < 3 ? 'text-white' : 'text-zinc-400'}`}>
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
  // ── Quarter 1 (top-left): M73→M90, M75→M90; M74→M89, M77→M89 ──
  { id: 'M73', venue: 'Toronto',         slots: [{ code: '2A', label: '2° Grupo A' }, { code: '2B', label: '2° Grupo B' }] },
  { id: 'M75', venue: 'Vancouver',       slots: [{ code: '1F', label: '1° Grupo F' }, { code: '2C', label: '2° Grupo C' }] },
  { id: 'M74', venue: 'Atlanta',         slots: [{ code: '1E', label: '1° Grupo E' }, { code: '3ABCDF', label: 'Mejor 3° (A,B,C,D,F)' }] },
  { id: 'M77', venue: 'Nueva York/NJ',   slots: [{ code: '1I', label: '1° Grupo I' }, { code: '3CDFGH', label: 'Mejor 3° (C,D,F,G,H)' }] },
  // ── Quarter 2 (bottom-left): M83→M93, M84→M93; M81→M94, M82→M94 ──
  { id: 'M83', venue: 'Filadelfia',      slots: [{ code: '2K', label: '2° Grupo K' }, { code: '2L', label: '2° Grupo L' }] },
  { id: 'M84', venue: 'Miami',           slots: [{ code: '1H', label: '1° Grupo H' }, { code: '2J', label: '2° Grupo J' }] },
  { id: 'M81', venue: 'Dallas',          slots: [{ code: '1D', label: '1° Grupo D' }, { code: '3BEFIJ', label: 'Mejor 3° (B,E,F,I,J)' }] },
  { id: 'M82', venue: 'Monterrey',       slots: [{ code: '1G', label: '1° Grupo G' }, { code: '3AEHIJ', label: 'Mejor 3° (A,E,H,I,J)' }] },
  // ── Quarter 3 (top-right): M76→M91, M78→M91; M79→M92, M80→M92 ──
  { id: 'M76', venue: 'Los Ángeles',    slots: [{ code: '1C', label: '1° Grupo C' }, { code: '2F', label: '2° Grupo F' }] },
  { id: 'M78', venue: 'San Francisco',  slots: [{ code: '2E', label: '2° Grupo E' }, { code: '2I', label: '2° Grupo I' }] },
  { id: 'M79', venue: 'Ciudad de México', slots: [{ code: '1A', label: '1° Grupo A' }, { code: '3CEFHI', label: 'Mejor 3° (C,E,F,H,I)' }] },
  { id: 'M80', venue: 'Boston',         slots: [{ code: '1L', label: '1° Grupo L' }, { code: '3EHIJK', label: 'Mejor 3° (E,H,I,J,K)' }] },
  // ── Quarter 4 (bottom-right): M86→M95, M88→M95; M85→M96, M87→M96 ──
  { id: 'M86', venue: 'Houston',        slots: [{ code: '1J', label: '1° Grupo J' }, { code: '2H', label: '2° Grupo H' }] },
  { id: 'M88', venue: 'Seattle',        slots: [{ code: '2D', label: '2° Grupo D' }, { code: '2G', label: '2° Grupo G' }] },
  { id: 'M85', venue: 'Guadalajara',    slots: [{ code: '1B', label: '1° Grupo B' }, { code: '3EFGIJ', label: 'Mejor 3° (E,F,G,I,J)' }] },
  { id: 'M87', venue: 'Kansas City',    slots: [{ code: '1K', label: '1° Grupo K' }, { code: '3DEIJL', label: 'Mejor 3° (D,E,I,J,L)' }] },
];

const R16_MATCHES: KnockoutMatch[] = [
  { id: 'M90', venue: 'Toronto',          slots: [{ code: 'W73', label: 'Ganador M73' }, { code: 'W75', label: 'Ganador M75' }] },
  { id: 'M89', venue: 'Atlanta',          slots: [{ code: 'W74', label: 'Ganador M74' }, { code: 'W77', label: 'Ganador M77' }] },
  { id: 'M93', venue: 'Filadelfia',       slots: [{ code: 'W83', label: 'Ganador M83' }, { code: 'W84', label: 'Ganador M84' }] },
  { id: 'M94', venue: 'Dallas',           slots: [{ code: 'W81', label: 'Ganador M81' }, { code: 'W82', label: 'Ganador M82' }] },
  { id: 'M91', venue: 'Los Ángeles',      slots: [{ code: 'W76', label: 'Ganador M76' }, { code: 'W78', label: 'Ganador M78' }] },
  { id: 'M92', venue: 'Ciudad de México', slots: [{ code: 'W79', label: 'Ganador M79' }, { code: 'W80', label: 'Ganador M80' }] },
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
// Bracket en Árbol Clásico (CSS Grid con líneas conectoras)
// ============================================================

interface BracketGridItem {
  id: string;
  type: 'match' | 'spacer';
  match?: FilledMatch;
  gridRowStart: number;
  gridRowEnd: number;
  roundLabel?: string;
}

function buildBracketGrid(r32: FilledMatch[], r16: FilledMatch[], qf: FilledMatch[], sf: FilledMatch[], final: FilledMatch[], third: FilledMatch[]): BracketGridItem[][] {
  const columns: BracketGridItem[][] = [[], [], [], [], [], []];

  // Ronda de 32 (col 0): 16 matches, each at rows [i*2, i*2+1]
  r32.forEach((m, i) => {
    columns[0].push({ id: m.id, type: 'match', match: m, gridRowStart: i * 2 + 1, gridRowEnd: i * 2 + 2 });
  });

  // Octavos (col 1): 8 matches, each at rows [4i+1, 4i+2]
  r16.forEach((m, i) => {
    const rowStart = i * 4 + 2;
    columns[1].push({ id: m.id, type: 'match', match: m, gridRowStart: rowStart, gridRowEnd: rowStart });
    // vertical connector spacer above
    columns[1].push({ id: `v-${m.id}`, type: 'spacer', gridRowStart: i * 4 + 1, gridRowEnd: i * 4 + 1 });
  });

  // Cuartos (col 2): 4 matches, each at rows [8i+3, 8i+3]
  qf.forEach((m, i) => {
    const rowStart = i * 8 + 4;
    columns[2].push({ id: m.id, type: 'match', match: m, gridRowStart: rowStart, gridRowEnd: rowStart });
    columns[2].push({ id: `v-${m.id}`, type: 'spacer', gridRowStart: i * 8 + 3, gridRowEnd: i * 8 + 3 });
  });

  // Semifinal (col 3): 2 matches
  sf.forEach((m, i) => {
    const rowStart = i * 16 + 8;
    columns[3].push({ id: m.id, type: 'match', match: m, gridRowStart: rowStart, gridRowEnd: rowStart });
    columns[3].push({ id: `v-${m.id}`, type: 'spacer', gridRowStart: i * 16 + 7, gridRowEnd: i * 16 + 7 });
  });

  // Final (col 4): row 16
  final.forEach((m) => {
    columns[4].push({ id: m.id, type: 'match', match: m, gridRowStart: 16, gridRowEnd: 16 });
    columns[4].push({ id: `v-${m.id}`, type: 'spacer', gridRowStart: 15, gridRowEnd: 15 });
  });

  // Third place (col 4): row 18
  third.forEach((m) => {
    columns[5].push({ id: m.id, type: 'match', match: m, gridRowStart: 18, gridRowEnd: 18 });
    columns[5].push({ id: `v-${m.id}`, type: 'spacer', gridRowStart: 17, gridRowEnd: 17 });
  });

  return columns;
}

function BracketMatchCard({ match, col, row }: { match: FilledMatch; col: number; row: number }) {
  const isThirdSlot = (slot: string) => slot.startsWith('3');

  const getTeamDisplay = (team: TeamInfo | null, slot: string, label: string) => {
    if (team) {
      return (
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg shrink-0">{team.flag}</span>
          <span className="font-semibold text-sm text-white truncate">{team.name}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-lg shrink-0">🏳️</span>
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-zinc-500 font-medium truncate">Por definir</span>
          <span className="text-[9px] text-zinc-600 truncate">{label}</span>
        </div>
      </div>
    );
  };

  const teamBg = (team: TeamInfo | null, slot: string) => {
    if (team) return isThirdSlot(slot) ? 'border-orange-500/25 bg-orange-500/5' : 'border-emerald-500/25 bg-emerald-500/5';
    return 'border-zinc-800 bg-zinc-900/20';
  };

  return (
    <div
      className="relative group"
      style={{ gridColumn: col + 1, gridRow: `${row} / span 1`, alignSelf: 'center' }}
    >
      <div className="rounded-lg border border-zinc-800 bg-zinc-900/30 p-2.5 transition-all hover:border-zinc-700 hover:bg-zinc-900/50 shadow-sm">
        <div className="flex items-center gap-1.5 mb-1 text-[9px] text-zinc-600">
          <MapPin className="h-2.5 w-2.5" />
          <span className="truncate">{match.venue}</span>
          <span className="ml-auto font-bold text-zinc-600">{match.id}</span>
        </div>
        <div className={`rounded-lg px-2 py-1.5 border ${teamBg(match.teamA, match.slotA)}`}>
          {getTeamDisplay(match.teamA, match.slotA, match.labelA)}
        </div>
        <div className="flex items-center gap-1 px-1 my-0.5">
          <div className="flex-1 h-px bg-zinc-700/40"></div>
          <span className="text-[9px] font-bold text-zinc-600">VS</span>
          <div className="flex-1 h-px bg-zinc-700/40"></div>
        </div>
        <div className={`rounded-lg px-2 py-1.5 border ${teamBg(match.teamB, match.slotB)}`}>
          {getTeamDisplay(match.teamB, match.slotB, match.labelB)}
        </div>
      </div>
    </div>
  );
}

function BracketConnectors() {
  // Las líneas conectoras se dibujan con elementos posicionados absolutamente en el grid
  const connectors: { col: number; row: number; height?: number; side: 'left' | 'right' }[] = [];

  // Conectores verticales entre R32 que alimentan un mismo R16
  // Quarter 1: R32[0]+R32[1] → R16[0], R32[2]+R32[3] → R16[1]
  // Quarter 2: R32[4]+R32[5] → R16[2], R32[6]+R32[7] → R16[3]
  // ...y así sucesivamente
  for (let q = 0; q < 4; q++) {
    const baseIdx = q * 4;
    // R16 match at row = q*8+2 (quarter: 0→row 2, 1→row 10, 2→row 18, 3→row 26)
    // No, let me recalculate:
    // Q0: R16[0] at row 2, R16[1] at row 6
    // Q1: R16[2] at row 10, R16[3] at row 14
    // Q2: R16[4] at row 18, R16[5] at row 22
    // Q3: R16[6] at row 26, R16[7] at row 30
    for (let p = 0; p < 2; p++) {
      const r32RowA = (q * 4 + p * 2) * 2 + 1; // R32 match at this row
      const r32RowB = (q * 4 + p * 2 + 1) * 2 + 1;
      const r16Row = q * 8 + p * 4 + 2;
      connectors.push({ col: 0, row: r32RowA, side: 'right' });
      connectors.push({ col: 0, row: r32RowB, side: 'right' });
      connectors.push({ col: 1, row: r16Row, side: 'left' });
      // vertical line at col divider between R32 and R16, spanning from r32RowA to r32RowB
    }
  }

  return null; // Placeholder - las líneas se dibujan con CSS
}

function BracketTab({ groups }: { groups: GroupStandings[] }) {
  const results = new Map<string, string>();
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
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-4 flex items-start gap-3">
        <GitBranchPlus className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-sm font-bold text-white">
            {isGroupStageComplete ? '🏆 Fase de Grupos Completada' : '📊 Proyección Dinámica'}
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
          <p className="text-sm">No hay datos de fase de grupos. Haz clic en &quot;Actualizar&quot;.</p>
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

          {/* Bracket en árbol clásico con CSS Grid */}
          <style>{`
            .bracket-grid {
              display: grid;
              gap: 4px 16px;
              position: relative;
            }
            .bracket-grid .round-header {
              font-size: 11px;
              font-weight: 700;
              color: #a1a1aa;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              padding-bottom: 4px;
              border-bottom: 1px solid rgba(113,113,122,0.15);
              align-self: end;
            }
            .bracket-grid .round-header-0 { grid-column: 1; grid-row: 1; }
            .bracket-grid .round-header-1 { grid-column: 2; grid-row: 1; }
            .bracket-grid .round-header-2 { grid-column: 3; grid-row: 1; }
            .bracket-grid .round-header-3 { grid-column: 4; grid-row: 1; }
            .bracket-grid .round-header-4 { grid-column: 5; grid-row: 1; }
            .bracket-grid .round-header-5 { grid-column: 6; grid-row: 1; }

            /* Líneas conectoras horizontales y verticales */
            .bracket-line-h {
              position: relative;
              pointer-events: none;
            }
            .bracket-line-h::after {
              content: '';
              position: absolute;
              background: rgba(113,113,122,0.25);
            }
            /* Conector horizontal desde una tarjeta hacia la derecha */
            .bracket-conn-r {
              position: relative;
            }
            .bracket-conn-r::after {
              content: '';
              position: absolute;
              right: -16px;
              top: 50%;
              width: 16px;
              height: 1px;
              background: rgba(113,113,122,0.25);
            }
            /* Línea vertical que une dos R32 hacia un R16 */
            .bracket-vline {
              position: relative;
            }
            .bracket-vline::before {
              content: '';
              position: absolute;
              right: -16px;
              width: 1px;
              background: rgba(113,113,122,0.25);
            }
            .bracket-vline-down::before {
              top: 50%;
              bottom: 0;
            }
            .bracket-vline-up::before {
              top: 0;
              bottom: 50%;
            }
          `}</style>

          <div className="overflow-x-auto pb-8 -mx-4 px-4">
            <div className="bracket-grid" style={{
              gridTemplateColumns: 'repeat(6, minmax(180px, 1fr))',
              gridTemplateRows: 'auto repeat(32, minmax(0, auto))',
            }}>
              {/* Headers de cada ronda */}
              <div className="round-header round-header-0">Ronda de 32</div>
              <div className="round-header round-header-1">Octavos</div>
              <div className="round-header round-header-2">Cuartos</div>
              <div className="round-header round-header-3">Semifinal</div>
              <div className="round-header round-header-4">Final</div>
              <div className="round-header round-header-5">3er Lugar</div>

              {/* ── Ronda de 32 (col 1, filas 2-33) ── */}
              {r32.map((m, i) => {
                const row = i * 2 + 2;
                return (
                  <BracketMatchCard
                    key={m.id}
                    match={m}
                    col={0}
                    row={row}
                  />
                );
              })}

              {/* ── Octavos (col 2, filas 2-33) ── */}
              {r16.map((m, i) => {
                // R16[i] se centra entre R32[2i] (row=4i+2) y R32[2i+1] (row=4i+4)
                const row = i * 4 + 3;
                return (
                  <React.Fragment key={m.id}>
                    {/* Tarjeta */}
                    <BracketMatchCard match={m} col={1} row={row} />
                    {/* Conectores verticales desde R32 hacia R16 */}
                    <div style={{ gridColumn: 1, gridRow: `${i * 4 + 2} / span 1`, justifySelf: 'end', width: 16, position: 'relative' }}>
                      <div style={{ position: 'absolute', right: 0, top: '50%', width: 16, height: 1, background: 'rgba(113,113,122,0.25)' }} />
                    </div>
                    <div style={{ gridColumn: 1, gridRow: `${i * 4 + 4} / span 1`, justifySelf: 'end', width: 16, position: 'relative' }}>
                      <div style={{ position: 'absolute', right: 0, top: '50%', width: 16, height: 1, background: 'rgba(113,113,122,0.25)' }} />
                    </div>
                    {/* Línea vertical entre las dos R32 */}
                    <div style={{ gridColumn: 1, gridRow: `${i * 4 + 2} / span 3`, justifySelf: 'end', width: 1, position: 'relative' }}>
                      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, background: 'rgba(113,113,122,0.25)' }} />
                    </div>
                    {/* Conector horizontal desde línea vertical hasta R16 */}
                    <div style={{ gridColumn: '1 / 2', gridRow: `${row} / span 1`, justifySelf: 'end', alignSelf: 'center', position: 'relative' }}>
                      <div style={{ position: 'absolute', right: 0, width: 16, height: 1, background: 'rgba(113,113,122,0.25)' }} />
                    </div>
                  </React.Fragment>
                );
              })}

              {/* ── Cuartos (col 3) ── */}
              {qf.map((m, i) => {
                const row = i * 8 + 5;
                return (
                  <React.Fragment key={m.id}>
                    <BracketMatchCard match={m} col={2} row={row} />
                    {/* Conectores verticales desde R16 hacia QF */}
                    <div style={{ gridColumn: 2, gridRow: `${i * 8 + 3} / span 1`, justifySelf: 'end', width: 16, position: 'relative' }}>
                      <div style={{ position: 'absolute', right: 0, top: '50%', width: 16, height: 1, background: 'rgba(113,113,122,0.25)' }} />
                    </div>
                    <div style={{ gridColumn: 2, gridRow: `${i * 8 + 7} / span 1`, justifySelf: 'end', width: 16, position: 'relative' }}>
                      <div style={{ position: 'absolute', right: 0, top: '50%', width: 16, height: 1, background: 'rgba(113,113,122,0.25)' }} />
                    </div>
                    <div style={{ gridColumn: 2, gridRow: `${i * 8 + 3} / span 5`, justifySelf: 'end', width: 1, position: 'relative' }}>
                      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, background: 'rgba(113,113,122,0.25)' }} />
                    </div>
                    <div style={{ gridColumn: '2 / 3', gridRow: `${row} / span 1`, justifySelf: 'end', alignSelf: 'center', position: 'relative' }}>
                      <div style={{ position: 'absolute', right: 0, width: 16, height: 1, background: 'rgba(113,113,122,0.25)' }} />
                    </div>
                  </React.Fragment>
                );
              })}

              {/* ── Semifinal (col 4) ── */}
              {sf.map((m, i) => {
                const row = i * 16 + 9;
                return (
                  <React.Fragment key={m.id}>
                    <BracketMatchCard match={m} col={3} row={row} />
                    <div style={{ gridColumn: 3, gridRow: `${i * 16 + 5} / span 1`, justifySelf: 'end', width: 16, position: 'relative' }}>
                      <div style={{ position: 'absolute', right: 0, top: '50%', width: 16, height: 1, background: 'rgba(113,113,122,0.25)' }} />
                    </div>
                    <div style={{ gridColumn: 3, gridRow: `${i * 16 + 13} / span 1`, justifySelf: 'end', width: 16, position: 'relative' }}>
                      <div style={{ position: 'absolute', right: 0, top: '50%', width: 16, height: 1, background: 'rgba(113,113,122,0.25)' }} />
                    </div>
                    <div style={{ gridColumn: 3, gridRow: `${i * 16 + 5} / span 9`, justifySelf: 'end', width: 1, position: 'relative' }}>
                      <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, background: 'rgba(113,113,122,0.25)' }} />
                    </div>
                    <div style={{ gridColumn: '3 / 4', gridRow: `${row} / span 1`, justifySelf: 'end', alignSelf: 'center', position: 'relative' }}>
                      <div style={{ position: 'absolute', right: 0, width: 16, height: 1, background: 'rgba(113,113,122,0.25)' }} />
                    </div>
                  </React.Fragment>
                );
              })}

              {/* ── Final (col 5, row 17) ── */}
              {final.map((m) => (
                <React.Fragment key={m.id}>
                  <BracketMatchCard match={m} col={4} row={17} />
                  {/* Conectores desde SF al Final */}
                  <div style={{ gridColumn: 4, gridRow: `9 / span 1`, justifySelf: 'end', width: 16, position: 'relative' }}>
                    <div style={{ position: 'absolute', right: 0, top: '50%', width: 16, height: 1, background: 'rgba(113,113,122,0.25)' }} />
                  </div>
                  <div style={{ gridColumn: 4, gridRow: `25 / span 1`, justifySelf: 'end', width: 16, position: 'relative' }}>
                    <div style={{ position: 'absolute', right: 0, top: '50%', width: 16, height: 1, background: 'rgba(113,113,122,0.25)' }} />
                  </div>
                  <div style={{ gridColumn: 4, gridRow: `9 / span 17`, justifySelf: 'end', width: 1, position: 'relative' }}>
                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, background: 'rgba(113,113,122,0.25)' }} />
                  </div>
                  <div style={{ gridColumn: '4 / 5', gridRow: `17 / span 1`, justifySelf: 'end', alignSelf: 'center', position: 'relative' }}>
                    <div style={{ position: 'absolute', right: 0, width: 16, height: 1, background: 'rgba(113,113,122,0.25)' }} />
                  </div>
                </React.Fragment>
              ))}

              {/* ── 3er Lugar (col 6, row 19) ── */}
              {third.map((m) => (
                <React.Fragment key={m.id}>
                  <BracketMatchCard match={m} col={5} row={19} />
                  <div style={{ gridColumn: 4, gridRow: `9 / span 1`, justifySelf: 'end', width: 16, position: 'relative' }}>
                    <div style={{ position: 'absolute', right: 0, top: '50%', width: 16, height: 1, background: 'rgba(113,113,122,0.25)' }} />
                  </div>
                  <div style={{ gridColumn: 4, gridRow: `25 / span 1`, justifySelf: 'end', width: 16, position: 'relative' }}>
                    <div style={{ position: 'absolute', right: 0, top: '50%', width: 16, height: 1, background: 'rgba(113,113,122,0.25)' }} />
                  </div>
                  <div style={{ gridColumn: 4, gridRow: `9 / span 17`, justifySelf: 'end', width: 1, position: 'relative' }}>
                    <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 1, background: 'rgba(113,113,122,0.25)' }} />
                  </div>
                  <div style={{ gridColumn: '4 / 6', gridRow: `19 / span 1`, justifySelf: 'end', alignSelf: 'center', position: 'relative' }}>
                    <div style={{ position: 'absolute', right: 0, width: 16, height: 1, background: 'rgba(113,113,122,0.25)' }} />
                  </div>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Leyenda */}
          <details className="rounded-xl border border-zinc-800 bg-zinc-900/10">
            <summary className="px-5 py-3 text-sm font-bold text-zinc-300 cursor-pointer hover:text-white transition-colors">
              📖 Explicación de los emparejamientos
            </summary>
            <div className="px-5 pb-5 space-y-3 text-xs text-zinc-400">
              <p>El Mundial 2026 tiene <strong className="text-white">48 equipos</strong> divididos en <strong className="text-white">12 grupos de 4</strong>. Los <strong className="text-white">3 primeros</strong> de cada grupo (36 equipos) + los <strong className="text-white">8 mejores terceros</strong> clasifican a la Ronda de 32.</p>
              <p>Los cruces de la Ronda de 32 están predefinidos por la FIFA:</p>
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
            </div>
          </details>
        </>
      )}
    </div>
  );
}
