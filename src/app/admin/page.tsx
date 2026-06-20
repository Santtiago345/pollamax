'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { COUNTRIES, getFlagByCountryName } from '@/lib/countries';
import { calculatePoints } from '@/lib/rules';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  addDoc,
  writeBatch,
  increment,
  getDocs,
  where,
  setDoc,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ShieldAlert, Plus, Check, Play, Trophy, RefreshCw, Star, Trash2, Globe, Download } from 'lucide-react';

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

export default function AdminPage() {
  const { user, profile } = useAuth();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario Nuevo Partido
  const [newTeamA, setNewTeamA] = useState('');
  const [newTeamB, setNewTeamB] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [creating, setCreating] = useState(false);

  // Edición de Marcadores
  const [editingMatchId, setEditingMatchId] = useState<string | null>(null);
  const [editScoreA, setEditScoreA] = useState('');
  const [editScoreB, setEditScoreB] = useState('');
  const [updating, setUpdating] = useState(false);

  // Podio Final
  const [officialChampion, setOfficialChampion] = useState('');
  const [officialRunnerUp, setOfficialRunnerUp] = useState('');
  const [officialThirdPlace, setOfficialThirdPlace] = useState('');
  const [podiumProcessing, setPodiumProcessing] = useState(false);
  const [podiumProcessedStatus, setPodiumProcessedStatus] = useState(false);

  // Sincronización Mundial
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncResult, setSyncResult] = useState<{ message: string; status: string } | null>(null);

  // 1. Verificar si el usuario es administrador
  const isAdmin = profile?.isAdmin === true;

  // 2. Escuchar partidos en tiempo real
  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

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
        console.error('Error fetching matches in admin:', error);
        setLoading(false);
      }
    );

    // Revisar si los puntos de podio ya fueron procesados
    const checkPodiumStatus = async () => {
      try {
        const configSnap = await getDoc(doc(db, 'config', 'tournamentResults'));
        if (configSnap.exists() && configSnap.data().processed === true) {
          setPodiumProcessedStatus(true);
        }
      } catch (error) {
        console.error('Error checking config status:', error);
      }
    };
    checkPodiumStatus();

    return () => unsubscribe();
  }, [isAdmin]);

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamA || !newTeamB || !newDate || !newTime) {
      alert('Completa todos los campos para el partido.');
      return;
    }
    if (newTeamA === newTeamB) {
      alert('Los equipos deben ser diferentes.');
      return;
    }

    setCreating(true);
    try {
      const matchDateTime = new Date(`${newDate}T${newTime}`);

      const matchData = {
        teamA: newTeamA,
        teamB: newTeamB,
        teamAFlag: getFlagByCountryName(newTeamA),
        teamBFlag: getFlagByCountryName(newTeamB),
        date: matchDateTime.toISOString(),
        scoreA: null,
        scoreB: null,
        status: 'scheduled',
      };

      await addDoc(collection(db, 'matches'), matchData);

      // Limpiar formulario
      setNewTeamA('');
      setNewTeamB('');
      setNewDate('');
      setNewTime('');
      alert('Partido creado con éxito.');
    } catch (error) {
      console.error('Error creating match:', error);
      alert('Error al crear el partido.');
    } finally {
      setCreating(false);
    }
  };

  const handleStartMatchLive = async (matchId: string) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await updateDoc(matchRef, {
        status: 'live',
        scoreA: 0,
        scoreB: 0
      });
      alert('El partido está ahora EN VIVO.');
    } catch (error) {
      console.error('Error starting match live:', error);
    }
  };

  // Helper local para actualizar Firestore (Firebase no exporta updateDoc directamente en este script de lotes)
  const updateDoc = async (ref: any, data: any) => {
    const batch = writeBatch(db);
    batch.update(ref, data);
    await batch.commit();
  };

  const handleUpdateLiveScore = async (matchId: string, scoreA: number, scoreB: number) => {
    try {
      const matchRef = doc(db, 'matches', matchId);
      await updateDoc(matchRef, { scoreA, scoreB });
    } catch (error) {
      console.error('Error updating score:', error);
    }
  };

  const handleFinishMatch = async (match: Match) => {
    const gA = parseInt(editScoreA, 10);
    const gB = parseInt(editScoreB, 10);

    if (isNaN(gA) || isNaN(gB) || gA < 0 || gB < 0) {
      alert('Ingresa marcadores válidos.');
      return;
    }

    setUpdating(true);

    try {
      // 1. Obtener apuestas asociadas a este partido
      const betsQuery = query(
        collection(db, 'bets'),
        where('matchId', '==', match.id),
        where('processed', '==', false)
      );
      const querySnapshot = await getDocs(betsQuery);

      const batch = writeBatch(db);

      // 2. Modificar estado del partido a finalizado y guardar marcador final
      const matchRef = doc(db, 'matches', match.id);
      batch.update(matchRef, {
        scoreA: gA,
        scoreB: gB,
        status: 'finished'
      });

      // 3. Procesar cada apuesta, calcular puntos, rachas y sumárselos al perfil del usuario
      for (const betDoc of querySnapshot.docs) {
        const bet = betDoc.data();
        const pointsEarned = calculatePoints(bet.predA, bet.predB, gA, gB);

        const isExact = bet.predA === gA && bet.predB === gB;
        const predDiff = Math.sign(bet.predA - bet.predB);
        const actualDiff = Math.sign(gA - gB);
        const isWinner = predDiff === actualDiff && predDiff !== 0 && !isExact;

        const userRef = doc(db, 'users', bet.userId);
        const userSnap = await getDoc(userRef);
        const userData: any = userSnap.exists() ? userSnap.data() : {};
        const prevStreak = userData.streak || { type: null, count: 0 };

        let extraPoints = 0;
        let newStreak: any = { type: null, count: 0, lastMatchId: null };

        if (isExact) {
          const newCount = prevStreak.type === 'exact' ? (prevStreak.count || 0) + 1 : 1;
          if (newCount === 3) extraPoints = 1;
          else if (newCount >= 4) extraPoints = 2;
          newStreak = { type: 'exact', count: newCount, lastMatchId: match.id };
        } else if (isWinner) {
          const newCount = prevStreak.type === 'winner' ? (prevStreak.count || 0) + 1 : 1;
          if (newCount === 3) extraPoints = 3;
          else if (newCount >= 4) extraPoints = 1;
          newStreak = { type: 'winner', count: newCount, lastMatchId: match.id };
        } else {
          newStreak = { type: null, count: 0, lastMatchId: null };
        }

        const totalPoints = pointsEarned + extraPoints;

        // Actualizar apuesta
        batch.update(betDoc.ref, {
          pointsEarned: totalPoints,
          processed: true
        });

        // Incrementar puntos del usuario y guardar racha
        batch.update(userRef, {
          points: increment(totalPoints),
          streak: newStreak
        });

        // Escribir en el historial
        const historyRef = doc(collection(db, 'history'));
        batch.set(historyRef, {
          userId: bet.userId,
          userName: bet.userName,
          userPhoto: bet.userPhoto || null,
          message: `⚽ El partido ${match.teamA} vs ${match.teamB} finalizó ${gA}-${gB}. ${bet.userName} sumó +${totalPoints} puntos con su apuesta (${bet.predA}-${bet.predB})${extraPoints > 0 ? ` (+${extraPoints} pts por racha ${newStreak.type} x${newStreak.count})` : ''}.`,
          timestamp: new Date().toISOString()
        });

        // Entrada dedicada cuando se alcanza un hito de racha
        if (extraPoints > 0) {
          const streakTypeLabel = newStreak.type === 'exact' ? 'Marcadores Exactos' : 'Ganadores';
          const streakRef = doc(collection(db, 'history'));
          batch.set(streakRef, {
            userId: bet.userId,
            userName: bet.userName,
            userPhoto: bet.userPhoto || null,
            message: `🔥 ¡Racha de ${streakTypeLabel}! ${bet.userName} lleva ${newStreak.count} aciertos consecutivos y ganó +${extraPoints} pts extra.`,
            timestamp: new Date().toISOString()
          });
        }
      }

      // Resetear rachas de usuarios que no participaron en este partido
      const bettors = new Set(querySnapshot.docs.map(d => d.data().userId));
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach((uDoc) => {
        if (!bettors.has(uDoc.id)) {
          const uRef = doc(db, 'users', uDoc.id);
          batch.update(uRef, { streak: { type: null, count: 0, lastMatchId: null } });
        }
      });

      // Si nadie apostó, registrar fin del partido en el feed de todos modos
      if (querySnapshot.empty) {
        const historyRef = doc(collection(db, 'history'));
        batch.set(historyRef, {
          userId: 'system',
          userName: 'Sistema',
          message: `⚽ El partido ${match.teamA} vs ${match.teamB} finalizó ${gA}-${gB}.`,
          timestamp: new Date().toISOString()
        });
      }

      await batch.commit();

      setEditingMatchId(null);
      setEditScoreA('');
      setEditScoreB('');
      alert('Partido finalizado y puntos repartidos correctamente.');
    } catch (error) {
      console.error('Error finishing match:', error);
      alert('Ocurrió un error al finalizar el partido.');
    } finally {
      setUpdating(false);
    }
  };

  const handleProcessPodium = async () => {
    if (!officialChampion || !officialRunnerUp || !officialThirdPlace) {
      alert('Debes seleccionar las tres posiciones oficiales.');
      return;
    }

    if (officialChampion === officialRunnerUp || officialChampion === officialThirdPlace || officialRunnerUp === officialThirdPlace) {
      alert('Los equipos deben ser diferentes.');
      return;
    }

    const confirmRun = window.confirm(
      '¿Estás seguro de evaluar los puntos del Podio Final? Esta acción es irreversible y sumará 25, 17 o 13 puntos a los perfiles de los usuarios que acertaron.'
    );

    if (!confirmRun) return;

    setPodiumProcessing(true);

    try {
      // 1. Obtener todos los usuarios
      const usersQuery = collection(db, 'users');
      const querySnapshot = await getDocs(usersQuery);

      const batch = writeBatch(db);

      querySnapshot.forEach((userDoc) => {
        const userData = userDoc.data();
        let totalPodiumPoints = 0;

        if (userData.predictions) {
          const preds = userData.predictions;

          if (preds.champion === officialChampion) {
            totalPodiumPoints += 25;
          }
          if (preds.runnerUp === officialRunnerUp) {
            totalPodiumPoints += 17;
          }
          if (preds.thirdPlace === officialThirdPlace) {
            totalPodiumPoints += 13;
          }
        }

        if (totalPodiumPoints > 0) {
          // Incrementar los puntos del usuario
          batch.update(userDoc.ref, {
            points: increment(totalPodiumPoints)
          });

          // Registrar en el historial de actividad
          const historyRef = doc(collection(db, 'history'));
          batch.set(historyRef, {
            userId: userDoc.id,
            userName: userData.name,
            message: `🏆 ¡Gran Acierto! ${userData.name} sumó +${totalPodiumPoints} puntos del Podio Final del Mundial.`,
            timestamp: new Date().toISOString()
          });
        }
      });

      // Guardar resultados globales
      const configRef = doc(db, 'config', 'tournamentResults');
      batch.set(configRef, {
        champion: officialChampion,
        runnerUp: officialRunnerUp,
        thirdPlace: officialThirdPlace,
        processed: true,
        processedAt: new Date().toISOString()
      });

      await batch.commit();

      setPodiumProcessedStatus(true);
      alert('Puntos de podio procesados y sumados con éxito a los usuarios correspondientes.');
    } catch (error) {
      console.error('Error processing podium points:', error);
      alert('Error al procesar los puntos de podio.');
    } finally {
      setPodiumProcessing(false);
    }
  };

  const handleWorldCupSync = async () => {
    const confirmSync = window.confirm(
      '¿Sincronizar todos los partidos del Mundial 2026 desde openfootball?\n\nEsto importará o actualizará automáticamente todos los partidos y calculará las tablas de grupos.'
    );
    if (!confirmSync) return;

    setSyncLoading(true);
    setSyncResult(null);

    try {
      const response = await fetch('/api/world-cup-sync');
      const data = await response.json();
      setSyncResult({ message: data.message, status: data.status });
      if (data.status === 'success') {
        alert(`✅ ${data.message}`);
      } else {
        alert(`⚠️ ${data.message}`);
      }
    } catch (error) {
      setSyncResult({ message: 'Error de conexión al intentar sincronizar.', status: 'error' });
      alert('Error al conectar con la API de sincronización.');
    } finally {
      setSyncLoading(false);
    }
  };

  const handleSeedSampleData = async () => {
    const confirmSeed = window.confirm(
      '¿Deseas precargar 5 partidos de prueba para el Mundial (fase de grupos)?'
    );
    if (!confirmSeed) return;

    setLoading(true);
    try {
      const batch = writeBatch(db);

      const sampleMatches = [
        {
          teamA: 'Qatar',
          teamB: 'Ecuador',
          teamAFlag: '🇶🇦',
          teamBFlag: '🇪🇨',
          date: new Date(Date.now() + 10 * 60000).toISOString(), // En 10 minutos
          scoreA: null,
          scoreB: null,
          status: 'scheduled',
        },
        {
          teamA: 'Inglaterra',
          teamB: 'Alemania',
          teamAFlag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
          teamBFlag: '🇩🇪',
          date: new Date(Date.now() + 2 * 3600000).toISOString(), // En 2 horas
          scoreA: null,
          scoreB: null,
          status: 'scheduled',
        },
        {
          teamA: 'Argentina',
          teamB: 'Arabia Saudita',
          teamAFlag: '🇦🇷',
          teamBFlag: '🇸🇦',
          date: new Date(Date.now() + 24 * 3600000).toISOString(), // En 1 día
          scoreA: null,
          scoreB: null,
          status: 'scheduled',
        },
        {
          teamA: 'Francia',
          teamB: 'España',
          teamAFlag: '🇫🇷',
          teamBFlag: '🇪🇸',
          date: new Date(Date.now() + 48 * 3600000).toISOString(), // En 2 días
          scoreA: null,
          scoreB: null,
          status: 'scheduled',
        },
        {
          teamA: 'Brasil',
          teamB: 'Colombia',
          teamAFlag: '🇧🇷',
          teamBFlag: '🇨🇴',
          date: new Date(Date.now() + 72 * 3600000).toISOString(), // En 3 días
          scoreA: null,
          scoreB: null,
          status: 'scheduled',
        }
      ];

      sampleMatches.forEach((m) => {
        const matchRef = doc(collection(db, 'matches'));
        batch.set(matchRef, m);
      });

      await batch.commit();
      alert('5 Partidos precargados con éxito.');
    } catch (error) {
      console.error('Error seeding data:', error);
      alert('Error al precargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este partido?')) return;

    try {
      const matchRef = doc(db, 'matches', matchId);
      const batch = writeBatch(db);
      batch.delete(matchRef);
      await batch.commit();
      alert('Partido eliminado con éxito.');
    } catch (error) {
      console.error('Error deleting match:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-10 w-10 animate-spin text-amber-400" />
          <p className="text-sm font-medium text-amber-400/80 animate-pulse">Cargando panel de admin...</p>
        </div>
      </div>
    );
  }

  // Si no es admin
  if (!isAdmin) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-4 bg-zinc-950 text-white text-center">
        <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-950/10 p-8 shadow-xl">
          <ShieldAlert className="h-14 w-14 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white">Acceso Denegado</h2>
          <p className="text-zinc-400 text-sm mt-3">
            Lo sentimos, esta sección está reservada exclusivamente para los administradores de la polla.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 max-w-5xl mx-auto space-y-8 bg-zinc-950 text-white min-h-[85vh]">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-zinc-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-amber-400 flex items-center gap-2">
            Panel de Administración
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Gestión completa de partidos, estados, puntuación en vivo y evaluación del podio.
          </p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <button
            onClick={handleWorldCupSync}
            disabled={syncLoading}
            className="flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2.5 text-sm font-bold text-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
          >
            {syncLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            {syncLoading ? 'Sincronizando...' : 'Sincronizar Mundial'}
          </button>
          <button
            onClick={handleSeedSampleData}
            className="rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm font-bold text-zinc-300 hover:bg-zinc-700 transition-all"
          >
            Precargar prueba
          </button>
        </div>
      </div>

      {/* Resultado de la última sincronización */}
      {syncResult && (
        <div className={`rounded-xl border px-4 py-3 text-sm flex items-center gap-3 ${syncResult.status === 'success'
            ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
            : 'border-red-500/20 bg-red-500/5 text-red-400'
          }`}>
          {syncResult.status === 'success' ? <Check className="h-4 w-4 shrink-0" /> : <Globe className="h-4 w-4 shrink-0" />}
          {syncResult.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formularios de Configuración (Crear Partido y Podio) */}
        <div className="lg:col-span-1 space-y-8">
          {/* Crear Partido */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white border-b border-zinc-800/80 pb-2">
              <Plus className="h-5 w-5 text-emerald-400" />
              Nuevo Partido
            </h3>

            <form onSubmit={handleCreateMatch} className="space-y-4 text-sm">
              <div className="space-y-1">
                <label className="text-zinc-400 text-xs font-semibold uppercase">Equipo A</label>
                <select
                  value={newTeamA}
                  onChange={(e) => setNewTeamA(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 outline-none"
                  required
                >
                  <option value="">Selecciona...</option>
                  {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 text-xs font-semibold uppercase">Equipo B</label>
                <select
                  value={newTeamB}
                  onChange={(e) => setNewTeamB(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 outline-none"
                  required
                >
                  <option value="">Selecciona...</option>
                  {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs font-semibold uppercase">Fecha</label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 outline-none text-white"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs font-semibold uppercase">Hora</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 outline-none text-white"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full flex justify-center items-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 py-3 text-sm font-bold text-white shadow transition-all disabled:opacity-55"
              >
                {creating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Crear Partido
              </button>
            </form>
          </div>

          {/* Podio Oficial Torneo */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white border-b border-zinc-800/80 pb-2">
              <Trophy className="h-5 w-5 text-amber-400" />
              Finalizar Mundial
            </h3>

            {podiumProcessedStatus ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
                <Check className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-emerald-400">Podio Procesado</h4>
                <p className="text-xs text-zinc-400 mt-1">Los puntos finales han sido repartidos a los participantes.</p>
              </div>
            ) : (
              <div className="space-y-4 text-sm">
                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs font-semibold uppercase">Campeón Oficial</label>
                  <select
                    value={officialChampion}
                    onChange={(e) => setOfficialChampion(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl px-3.5 py-2.5 outline-none"
                  >
                    <option value="">Selecciona...</option>
                    {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs font-semibold uppercase">Subcampeón Oficial</label>
                  <select
                    value={officialRunnerUp}
                    onChange={(e) => setOfficialRunnerUp(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl px-3.5 py-2.5 outline-none"
                  >
                    <option value="">Selecciona...</option>
                    {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 text-xs font-semibold uppercase">Tercer Puesto Oficial</label>
                  <select
                    value={officialThirdPlace}
                    onChange={(e) => setOfficialThirdPlace(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 rounded-xl px-3.5 py-2.5 outline-none"
                  >
                    <option value="">Selecciona...</option>
                    {COUNTRIES.map(c => <option key={c.code} value={c.name}>{c.flag} {c.name}</option>)}
                  </select>
                </div>

                <button
                  onClick={handleProcessPodium}
                  disabled={podiumProcessing || !officialChampion || !officialRunnerUp || !officialThirdPlace}
                  className="w-full flex justify-center items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-600 py-3 text-sm font-bold text-black shadow transition-all disabled:opacity-55"
                >
                  {podiumProcessing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Trophy className="h-4 w-4" />}
                  Evaluar Puntos de Podio
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Partidos Existentes */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-white border-b border-zinc-800 pb-3">
            <Star className="h-5 w-5 text-emerald-400" />
            Lista de Partidos ({matches.length})
          </h3>

          {matches.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/10 p-12 text-center text-zinc-500">
              No hay partidos cargados. Utiliza el formulario o haz clic en "Precargar partidos de prueba".
            </div>
          ) : (
            <div className="space-y-4">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5 flex flex-col md:flex-row md:items-center justify-between gap-5 transition-all hover:bg-zinc-900/35"
                >
                  {/* Detalles del Partido */}
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-3xl filter drop-shadow-md">{match.teamAFlag}</span>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-bold text-white text-base">
                        {match.teamA} vs {match.teamB} {match.teamBFlag}
                      </span>
                      <span className="text-xs text-zinc-500 font-medium mt-0.5">
                        {new Date(match.date).toLocaleString('es-ES')}
                      </span>
                    </div>
                  </div>

                  {/* Acciones y Marcador */}
                  <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-zinc-800/80 pt-3 md:pt-0">
                    {/* Visualizar Estado/Marcador */}
                    <div className="flex items-center gap-3">
                      {editingMatchId === match.id ? (
                        // Edición de Marcador Final
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            min="0"
                            value={editScoreA}
                            onChange={(e) => setEditScoreA(e.target.value)}
                            placeholder="A"
                            className="w-10 h-10 text-center bg-zinc-950 border border-zinc-800 rounded-lg font-bold text-white outline-none"
                          />
                          <span className="text-zinc-600 text-xs font-bold">-</span>
                          <input
                            type="number"
                            min="0"
                            value={editScoreB}
                            onChange={(e) => setEditScoreB(e.target.value)}
                            placeholder="B"
                            className="w-10 h-10 text-center bg-zinc-950 border border-zinc-800 rounded-lg font-bold text-white outline-none"
                          />
                          <button
                            onClick={() => handleFinishMatch(match)}
                            disabled={updating}
                            className="h-10 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1"
                          >
                            {updating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Fin'}
                          </button>
                          <button
                            onClick={() => setEditingMatchId(null)}
                            className="h-10 px-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 text-xs font-semibold"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        // Ver Marcador Actual o Pendiente
                        <div className="flex items-center gap-3">
                          {match.status === 'finished' ? (
                            <div className="bg-zinc-950 border border-zinc-900 px-3 py-1.5 rounded-lg text-sm font-black text-zinc-300">
                              {match.scoreA} - {match.scoreB}
                            </div>
                          ) : match.status === 'live' ? (
                            <div className="flex items-center gap-2">
                              {/* Inputs rápidos para goles en vivo */}
                              <button
                                onClick={() => handleUpdateLiveScore(match.id, (match.scoreA ?? 0) + 1, match.scoreB ?? 0)}
                                className="h-7 w-7 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-extrabold text-xs"
                              >
                                +A
                              </button>
                              <div className="bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg text-sm font-black text-red-500">
                                {match.scoreA} - {match.scoreB}
                              </div>
                              <button
                                onClick={() => handleUpdateLiveScore(match.id, match.scoreA ?? 0, (match.scoreB ?? 0) + 1)}
                                className="h-7 w-7 rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 font-extrabold text-xs"
                              >
                                +B
                              </button>
                            </div>
                          ) : (
                            <span className="text-zinc-500 text-xs italic">No iniciado</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Botones de Control de Estados del Partido */}
                    {editingMatchId !== match.id && (
                      <div className="flex items-center gap-2">
                        {match.status === 'scheduled' && (
                          <button
                            onClick={() => handleStartMatchLive(match.id)}
                            className="h-9 px-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/25 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                          >
                            <Play className="h-3 w-3" /> Poner Vivo
                          </button>
                        )}

                        {(match.status === 'scheduled' || match.status === 'live') && (
                          <button
                            onClick={() => {
                              setEditingMatchId(match.id);
                              setEditScoreA(String(match.scoreA ?? 0));
                              setEditScoreB(String(match.scoreB ?? 0));
                            }}
                            className="h-9 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/25 text-xs font-bold flex items-center gap-1 transition-all active:scale-95"
                          >
                            Finalizar
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteMatch(match.id)}
                          className="h-9 w-9 rounded-xl bg-zinc-800 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center transition-all"
                          title="Eliminar partido"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
