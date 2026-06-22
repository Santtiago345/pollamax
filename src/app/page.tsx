'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { Trophy, Star, ShieldCheck, Flame, LogIn, Swords, ClipboardList, ListOrdered, Calendar, Globe, Timer, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import ScrollReveal from '@/components/ScrollReveal';
import { fetchWorldCupData, processMatches, getSpanishName, type ProcessedMatch } from '@/lib/worldCupData';

function useCountdown(targetDate: Date): string {
  const [display, setDisplay] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const diff = targetDate.getTime() - now.getTime();
      if (diff <= 0) { setDisplay('Comenzando...'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setDisplay(`${h}h ${m}m ${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  return display;
}

export default function Home() {
  const { user, profile, loading, loginWithGoogle, logout } = useAuth();
  const [authError, setAuthError] = useState<string | null>(null);

  const handleLogin = async () => {
    try {
      setAuthError(null);
      await loginWithGoogle();
    } catch (error: any) {
      setAuthError('Error al iniciar sesión. Inténtalo de nuevo.');
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center bg-radial from-slate-900 via-zinc-950 to-black text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-emerald-500 border-t-amber-400"></div>
          <p className="text-lg font-medium text-emerald-400 animate-pulse">Cargando PollaMax...</p>
        </div>
      </div>
    );
  }

  // Vista de Usuario No Autenticado (Login)
  if (!user) {
    return (
      <div className="flex min-h-[85vh] flex-col items-center justify-center px-4 bg-zinc-950 text-white relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="w-full max-w-md rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-8 backdrop-blur-xl shadow-2xl relative z-10 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-emerald-400 shadow-lg shadow-emerald-500/30">
            <Trophy className="h-10 w-10 text-amber-300" />
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Polla<span className="bg-gradient-to-r from-emerald-400 to-amber-300 bg-clip-text text-transparent">Max</span>
          </h1>
          <p className="mt-3 text-zinc-400 text-sm sm:text-base">
            La polla futbolera familiar más emocionante del Mundial. ¡Pronostica, compite y gana en tiempo real!
          </p>

          {authError && (
            <div className="mt-4 rounded-lg bg-red-950/50 border border-red-500/30 p-3 text-sm text-red-400">
              {authError}
            </div>
          )}

          <div className="mt-8 space-y-4">
            <button
              onClick={handleLogin}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-5 py-3.5 text-base font-bold text-white shadow-lg shadow-emerald-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-emerald-500/40"
            >
              <LogIn className="h-5 w-5" />
              Ingresar con Google
            </button>
          </div>

          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-amber-400" /> Actualizaciones en vivo</span>
            <span className="flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-orange-400" /> Consigue una racha de apuestas para ganar mas puntos!</span>
          </div>
        </div>
      </div>
    );
  }

  // Vista de Dashboard de Usuario Autenticado
  return (
    <div className="py-6 px-4 max-w-4xl mx-auto space-y-8 bg-zinc-950 text-white min-h-[85vh]">
      {/* Partido en Vivo y Próximo Partido */}
      <HomeMatchBanners />

      {/* Bienvenida */}
      <ScrollReveal>
      <div className="relative rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8 overflow-hidden">
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">
              ¡Hola, <span className="bg-gradient-to-r from-emerald-400 to-amber-300 bg-clip-text text-transparent">{profile?.name}</span>! 👋
            </h2>
            <p className="text-zinc-400 mt-2 text-sm sm:text-base">
              Bienvenido al centro de control de tu polla futbolera. Pronostica los partidos del mundial y sube en la clasificación general.
            </p>
          </div>
          <div className="flex gap-4">
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 px-5 py-3 text-center min-w-[100px]">
              <span className="text-xs text-zinc-500 block uppercase tracking-wider font-semibold">Puntos</span>
              <span className="text-2xl font-extrabold text-amber-400">{profile?.points ?? 0}</span>
            </div>
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35 }}
                className={`rounded-xl border px-4 py-3 flex items-center gap-3 ${profile?.streak?.type && profile.streak.count > 0 ? (profile.streak.type === 'exact' ? 'border-emerald-500 bg-emerald-500/6 text-emerald-300' : 'border-red-500 bg-red-500/6 text-red-300') : 'border-zinc-700 bg-zinc-800/20 text-zinc-500'}`}>
                <Flame className={`h-5 w-5 ${profile?.streak?.type && profile.streak.count > 0 ? 'text-orange-400' : 'text-zinc-600'}`} />
                <div className="text-sm">
                  {profile?.streak?.type && profile.streak.count > 0 ? (
                    <>
                      <div className="font-bold">{profile.streak.type === 'exact' ? 'Racha Marcadores' : 'Racha Ganadores'}</div>
                      <div className="text-xs">{profile.streak.count} partidos seguidos</div>
                    </>
                  ) : (
                    <>
                      <div className="font-bold">Sin Racha</div>
                      <div className="text-xs">Acierta partidos seguidos para activar rachas</div>
                    </>
                  )}
                </div>
              </motion.div>
            {profile?.isAdmin && (
              <Link
                href="/admin"
                className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm font-semibold text-amber-400 hover:bg-amber-500/20 transition-all"
              >
                <ShieldCheck className="h-4 w-4" />
                Panel Admin
              </Link>
            )}
          </div>
        </div>
      </div>
      </ScrollReveal>

      {/* Grid de Accesos Directos */}
      <ScrollReveal delay={0.1}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Ir a partidos */}
        <Link
          href="/matches"
          className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 hover:border-emerald-500/50 hover:bg-zinc-900/60 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <motion.div
              animate={{ rotate: [0, -10, 10, 0], scale: [1, 1.08, 1.08, 1] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition-all"
            >
              <Swords className="h-6 w-6" />
            </motion.div>
            <span className="text-xs font-semibold text-zinc-500 group-hover:text-emerald-400 transition-all">Ir a apostar &rarr;</span>
          </div>
          <h3 className="mt-4 text-xl font-bold text-white">Pronósticos de Partidos</h3>
          <p className="mt-2 text-zinc-400 text-sm">
            Ingresa o edita tus marcadores para los próximos partidos antes del pitazo inicial (bloqueo 5 minutos antes).
          </p>
        </Link>

        {/* Clasificación */}
        <Link
          href="/ranking"
          className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 hover:border-amber-500/50 hover:bg-zinc-900/60 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <motion.div
              animate={{ y: [0, -4, 0, 4, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition-all"
            >
              <ListOrdered className="h-6 w-6" />
            </motion.div>
            <span className="text-xs font-semibold text-zinc-500 group-hover:text-amber-400 transition-all">Ver posiciones &rarr;</span>
          </div>
          <h3 className="mt-4 text-xl font-bold text-white">Tabla de Posiciones</h3>
          <p className="mt-2 text-zinc-400 text-sm">
            Consulta el ranking en tiempo real de todos los participantes y entérate de quién lidera el torneo.
          </p>
        </Link>

        {/* Mundial */}
        <Link
          href="/mundial"
          className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 hover:border-purple-500/50 hover:bg-zinc-900/60 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition-all"
            >
              <Globe className="h-6 w-6" />
            </motion.div>
            <span className="text-xs font-semibold text-zinc-500 group-hover:text-purple-400 transition-all">Ver Mundial &rarr;</span>
          </div>
          <h3 className="mt-4 text-xl font-bold text-white">Mundial 2026</h3>
          <p className="mt-2 text-zinc-400 text-sm">
            Sigue todos los partidos del Mundial en vivo, consulta las tablas de grupos y el bracket con resultados y pronósticos.
          </p>
        </Link>

        {/* Historial de apuestas */}
        <Link
          href="/feed"
          className="group relative rounded-2xl border border-zinc-800 bg-zinc-900/30 p-6 hover:border-cyan-500/50 hover:bg-zinc-900/60 transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <motion.div
              animate={{ scale: [1, 1.12, 1, 0.92, 1] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition-all"
            >
              <ClipboardList className="h-6 w-6" />
            </motion.div>
            <span className="text-xs font-semibold text-zinc-500 group-hover:text-cyan-400 transition-all">Ver actividad &rarr;</span>
          </div>
          <h3 className="mt-4 text-xl font-bold text-white">Historial de Actividad</h3>
          <p className="mt-2 text-zinc-400 text-sm">
            Sigue las últimas predicciones de otros jugadores en tiempo real para ver qué marcadores están jugando.
          </p>
        </Link>
      </div>
      </ScrollReveal>

      {/* Reglas de puntuación en miniatura */}
      <ScrollReveal delay={0.2}>
      <div id="puntos" className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 space-y-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, -8, 8, -4, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Calendar className="h-5 w-5 text-emerald-400" />
          </motion.div>
          Lógica de Puntuación PollaMax
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <motion.div whileHover={{ scale: 1.05 }} className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
            <span className="text-zinc-500 block text-xs">Marcador Exacto</span>
            <span className="text-lg font-bold text-emerald-400">+2 Bonus</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
            <span className="text-zinc-500 block text-xs">Ganador Correcto</span>
            <span className="text-lg font-bold text-emerald-400">+5 Puntos</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
            <span className="text-zinc-500 block text-xs">Empate Correcto</span>
            <span className="text-lg font-bold text-emerald-400">+3 Puntos</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
            <span className="text-zinc-500 block text-xs">Diferencia de Goles</span>
            <span className="text-lg font-bold text-emerald-400">+1 Punto</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
            <span className="text-zinc-500 block text-xs">Goles de un Equipo</span>
            <span className="text-lg font-bold text-emerald-400">+1 Punto c/u</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
            <span className="text-zinc-500 block text-xs">Acierto Campeón</span>
            <span className="text-lg font-bold text-amber-400">+25 Puntos</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
            <span className="text-zinc-500 block text-xs">Acierto Subcampeón</span>
            <span className="text-lg font-bold text-amber-400">+17 Puntos</span>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} className="bg-zinc-900/50 rounded-xl p-3 border border-zinc-800/50">
            <span className="text-zinc-500 block text-xs">Acierto Tercero</span>
            <span className="text-lg font-bold text-amber-400">+13 Puntos</span>
          </motion.div>
        </div>

        {/* Sección de Rachas */}
        <div id="rachas">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-orange-600/5 p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-400" />
            <h4 className="font-bold text-orange-300">Sistema de Rachas</h4>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Al acertar consecutivamente, activas rachas que multiplican tus puntos extra. Se consolidan solo al finalizar cada partido.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🎯</span>
                <span className="font-bold text-emerald-300">Racha de Marcadores</span>
              </div>
              <span className="text-xs text-zinc-400">Acierta el marcador exacto 2 veces seguidas → +1 pt extra, y +1 pt por cada acierto adicional</span>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">E</span>
                <span className="text-zinc-600">→</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/40">E +1</span>
                <span className="text-zinc-600">→</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/40">E +2</span>
                <span className="text-zinc-600">→</span>
                <span className="bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/40">E +3</span>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.03 }}
              className="rounded-xl border border-red-500/20 bg-red-500/5 p-3"
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">⚡</span>
                <span className="font-bold text-red-300">Racha de Ganadores</span>
              </div>
              <span className="text-xs text-zinc-400">Acierta el ganador (no exacto) 3 veces seguidas → +3 pts extra, 4+ → +1 pt extra</span>
              <div className="mt-2 flex items-center gap-2 text-xs">
                <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold">G</span>
                <span className="text-zinc-600">→</span>
                <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-bold">G</span>
                <span className="text-zinc-600">→</span>
                <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-bold border border-red-500/40">G +3</span>
                <span className="text-zinc-600">→</span>
                <span className="bg-red-500/20 text-red-300 px-2 py-0.5 rounded-full font-bold border border-red-500/40">G +1</span>
              </div>
            </motion.div>
          </div>
          <p className="text-[11px] text-zinc-500 italic">
            Si fallas un pronóstico, tu racha se reinicia. Las rachas solo se actualizan al finalizar cada partido.
          </p>
        </motion.div>
        </div>
      </div>
      </ScrollReveal>
    </div>
  );
}

function HomeMatchBanners() {
  const [matches, setMatches] = useState<ProcessedMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const load = async () => {
      try {
        const raw = await fetchWorldCupData();
        if (raw?.matches) {
          setMatches(processMatches(raw.matches));
        }
      } catch (e) {
        console.error('Error loading matches for home:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const liveMatches = matches.filter(m => m.status === 'live');

  const now = new Date();
  const next = matches
    .filter(m => m.status === 'scheduled' && new Date(m.date) > now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0];

  if (loading || (liveMatches.length === 0 && !next)) return null;

  const formatTime = (date: Date) =>
    date.toLocaleTimeString('es-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* En Vivo */}
      {liveMatches.length > 0 ? (
        liveMatches.map(lm => (
          <motion.div
            key={lm.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="rounded-xl border border-red-500/40 bg-gradient-to-br from-red-500/10 via-zinc-900/60 to-red-600/5 p-4 shadow-lg shadow-red-500/10"
          >
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-red-400 uppercase tracking-widest mb-2">
              <motion.span
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                className="h-2 w-2 rounded-full bg-red-500"
              />
              En Vivo
            </div>
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center gap-0.5 min-w-0 flex-1">
                <span className="text-xl">{lm.teamAFlag}</span>
                <span className="text-[11px] font-bold text-white truncate max-w-full">{getSpanishName(lm.teamA)}</span>
              </div>
              <div className="flex flex-col items-center px-1">
                <span className="text-xl font-black text-red-400">{lm.scoreA ?? 0}-{lm.scoreB ?? 0}</span>
                <span className="text-[9px] text-red-400 font-mono">{lm.minutes}'</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 min-w-0 flex-1">
                <span className="text-xl">{lm.teamBFlag}</span>
                <span className="text-[11px] font-bold text-white truncate max-w-full">{getSpanishName(lm.teamB)}</span>
              </div>
            </div>
          </motion.div>
        ))
      ) : (
        <div />
      )}

      {/* Próximo Partido */}
      {next && (
        <NextMatchMini match={next} formatTime={formatTime} />
      )}
    </div>
  );
}

function NextMatchMini({ match, formatTime }: { match: ProcessedMatch; formatTime: (d: Date) => string }) {
  const matchTime = new Date(match.date);
  const countdown = useCountdown(matchTime);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-xl border border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-zinc-900/60 to-emerald-600/5 p-4 shadow-lg shadow-emerald-500/5"
    >
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">
        <Timer className="h-3 w-3" />
        Próximo
      </div>
      <div className="flex items-center gap-2">
        <div className="flex flex-col items-center gap-0.5 min-w-0 flex-1">
          <span className="text-xl">{match.teamAFlag}</span>
          <span className="text-[11px] font-bold text-white truncate max-w-full">{getSpanishName(match.teamA)}</span>
        </div>
        <div className="flex flex-col items-center px-1">
          <span className="text-sm font-black text-emerald-400">VS</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 min-w-0 flex-1">
          <span className="text-xl">{match.teamBFlag}</span>
          <span className="text-[11px] font-bold text-white truncate max-w-full">{getSpanishName(match.teamB)}</span>
        </div>
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-emerald-500/10 pt-2">
        <motion.span
          key={countdown}
          initial={{ opacity: 0.6, y: 2 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-black font-mono text-emerald-300 tracking-wider tabular-nums"
        >
          {countdown}
        </motion.span>
        <span className="text-[10px] text-zinc-400 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatTime(matchTime)}
        </span>
      </div>
    </motion.div>
  );
}
