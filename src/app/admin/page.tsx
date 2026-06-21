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
  getDoc,
  deleteDoc,
  updateDoc,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ShieldAlert, Plus, Check, Play, Trophy, RefreshCw, Star, Trash2, Globe, Download, Bell, BellRing, BellOff, Users, TrendingUp, UserPlus, ClipboardList, History, AlertTriangle, Database, Search, X, Ban, Settings, FileText, MessageSquare, Eye, EyeOff } from 'lucide-react';
import { sendBrowserNotification, isIOS, isNotificationSupported, showInAppAlert } from '@/lib/notifications';

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

  // Gestión del Feed
  const [feedEntries, setFeedEntries] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedDeleting, setFeedDeleting] = useState<string | null>(null);

  // Gestión de Apuestas
  const [betsForMatch, setBetsForMatch] = useState<any[]>([]);
  const [selectedBetMatchId, setSelectedBetMatchId] = useState('');
  const [betsLoading, setBetsLoading] = useState(false);
  const [betDeleting, setBetDeleting] = useState<string | null>(null);

  // Gestión de Usuarios
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userActionLoading, setUserActionLoading] = useState<string | null>(null);

  // Datos Firebase
  const [firebaseStats, setFirebaseStats] = useState<Record<string, number>>({});
  const [configData, setConfigData] = useState<any>(null);
  const [showConfig, setShowConfig] = useState(false);

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

  const handleLoadFeed = async () => {
    setFeedLoading(true);
    try {
      const q = query(collection(db, 'history'), orderBy('timestamp', 'desc'), limit(100));
      const snap = await getDocs(q);
      const entries = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
      setFeedEntries(entries);
    } catch (e) {
      console.error('Error loading feed:', e);
      alert('Error al cargar el feed.');
    } finally {
      setFeedLoading(false);
    }
  };

  const handleDeleteFeedEntry = async (docId: string) => {
    if (!window.confirm('¿Eliminar esta entrada del feed?')) return;
    setFeedDeleting(docId);
    try {
      await deleteDoc(doc(db, 'history', docId));
      setFeedEntries(prev => prev.filter(e => e.docId !== docId));
    } catch (e) {
      console.error('Error deleting feed entry:', e);
      alert('Error al eliminar la entrada.');
    } finally {
      setFeedDeleting(null);
    }
  };

  const handleClearAllFeed = async () => {
    if (!window.confirm('¿Eliminar TODAS las entradas del feed? Esto no se puede deshacer.')) return;
    setFeedLoading(true);
    try {
      const snap = await getDocs(collection(db, 'history'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setFeedEntries([]);
      alert('Feed limpiado correctamente.');
    } catch (e) {
      console.error('Error clearing feed:', e);
      alert('Error al limpiar el feed.');
    } finally {
      setFeedLoading(false);
    }
  };

  const handleLoadBetsForMatch = async (matchId: string) => {
    if (!matchId) { setBetsForMatch([]); return; }
    setBetsLoading(true);
    try {
      const q = query(collection(db, 'bets'), where('matchId', '==', matchId));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ docId: d.id, ...d.data() }));
      setBetsForMatch(list);
    } catch (e) {
      console.error('Error loading bets:', e);
    } finally {
      setBetsLoading(false);
    }
  };

  const handleDeleteBet = async (docId: string) => {
    if (!window.confirm('¿Eliminar esta apuesta?')) return;
    setBetDeleting(docId);
    try {
      await deleteDoc(doc(db, 'bets', docId));
      setBetsForMatch(prev => prev.filter(b => b.docId !== docId));
    } catch (e) {
      console.error('Error deleting bet:', e);
      alert('Error al eliminar la apuesta.');
    } finally {
      setBetDeleting(null);
    }
  };

  const handleClearBetsForMatch = async (matchId: string) => {
    if (!window.confirm(`¿Eliminar TODAS las apuestas del partido "${matchId}"? Esto no se puede deshacer.`)) return;
    setBetsLoading(true);
    try {
      const q = query(collection(db, 'bets'), where('matchId', '==', matchId));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setBetsForMatch([]);
      alert(`Apuestas del partido ${matchId} eliminadas.`);
    } catch (e) {
      console.error('Error clearing bets:', e);
      alert('Error al limpiar apuestas.');
    } finally {
      setBetsLoading(false);
    }
  };

  const handleLoadUsers = async () => {
    setUsersLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const list = snap.docs.map(d => ({ docId: d.id, ...d.data() })).sort((a: any, b: any) => (b.points || 0) - (a.points || 0));
      setAllUsers(list);
    } catch (e) {
      console.error('Error loading users:', e);
      alert('Error al cargar usuarios.');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: string, current: boolean) => {
    setUserActionLoading(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { isAdmin: !current });
      setAllUsers(prev => prev.map(u => u.docId === userId ? { ...u, isAdmin: !current } : u));
    } catch (e) {
      console.error('Error toggling admin:', e);
      alert('Error al cambiar rol.');
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleSetUserPoints = async (userId: string, userName: string) => {
    const input = prompt(`Nuevos puntos para ${userName}:`, '0');
    if (input === null) return;
    const pts = parseInt(input, 10);
    if (isNaN(pts)) { alert('Ingresa un número válido.'); return; }
    setUserActionLoading(userId);
    try {
      await setDoc(doc(db, 'users', userId), { points: pts }, { merge: true });
      setAllUsers(prev => prev.map(u => u.docId === userId ? { ...u, points: pts } : u));
      alert(`Puntos de ${userName} actualizados a ${pts}.`);
    } catch (e) {
      console.error('Error setting points:', e);
      alert('Error al actualizar puntos.');
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!window.confirm(`¿Eliminar al usuario "${userName}" (${userId}) permanentemente? También se eliminarán sus apuestas.`)) return;
    setUserActionLoading(userId);
    try {
      const batch = writeBatch(db);
      batch.delete(doc(db, 'users', userId));
      const betsSnap = await getDocs(query(collection(db, 'bets'), where('userId', '==', userId)));
      betsSnap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setAllUsers(prev => prev.filter(u => u.docId !== userId));
      alert(`Usuario "${userName}" eliminado.`);
    } catch (e) {
      console.error('Error deleting user:', e);
      alert('Error al eliminar usuario.');
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleLoadFirebaseStats = async () => {
    try {
      const collections = ['matches', 'bets', 'users', 'history', 'config'];
      const stats: Record<string, number> = {};
      for (const name of collections) {
        const snap = await getDocs(collection(db, name));
        stats[name] = snap.size;
      }
      setFirebaseStats(stats);
      const configSnap = await getDoc(doc(db, 'config', 'tournamentResults'));
      setConfigData(configSnap.exists() ? configSnap.data() : null);
    } catch (e) {
      console.error('Error loading stats:', e);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('¿Eliminar datos cacheados del Mundial (worldCupCache)?')) return;
    try {
      const snap = await getDocs(collection(db, 'worldCupCache'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      alert('Caché eliminado.');
    } catch (e) {
      console.error('Error clearing cache:', e);
      alert('Error al limpiar caché.');
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
          {/* NOTA: Sección de Prueba de Notificaciones */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white border-b border-zinc-800/80 pb-2">
              <Bell className="h-5 w-5 text-purple-400" />
              Probar Notificaciones
            </h3>
            <p className="text-xs text-zinc-500">
              {isIOS()
                ? 'En iOS las notificaciones nativas no están disponibles. Las pruebas se mostrarán como avisos en pantalla.'
                : 'Haz clic para enviar una notificación de prueba. Debes aceptar las notificaciones en tu navegador primero.'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => {
                  const title = '🔔 Recordatorio';
                  const body = 'Queda 1 hora para Argentina vs Brasil. ¡No olvides apostar!';
                  if (isIOS() || !isNotificationSupported()) { showInAppAlert(title, body); return; }
                  if (Notification.permission !== 'granted') { alert('Primero acepta las notificaciones en el banner.'); return; }
                  sendBrowserNotification(title, body);
                }}
                className="flex flex-col items-center gap-1 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-3 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-all"
              >
                <BellRing className="h-5 w-5" />
                Recordatorio
              </button>
              <button
                onClick={() => {
                  const title = '📊 Apuesta registrada';
                  const body = 'María apostó 2-1 en Alemania vs Francia.';
                  if (isIOS() || !isNotificationSupported()) { showInAppAlert(title, body); return; }
                  if (Notification.permission !== 'granted') { alert('Acepta las notificaciones primero.'); return; }
                  sendBrowserNotification(title, body);
                }}
                className="flex flex-col items-center gap-1 rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-3 py-3 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/10 transition-all"
              >
                <Users className="h-5 w-5" />
                Apuesta
              </button>
              <button
                onClick={() => {
                  const title = '🔥 Racha';
                  const body = 'Pedro lleva 4 aciertos consecutivos en Marcadores Exactos!';
                  if (isIOS() || !isNotificationSupported()) { showInAppAlert(title, body); return; }
                  if (Notification.permission !== 'granted') { alert('Acepta las notificaciones primero.'); return; }
                  sendBrowserNotification(title, body);
                }}
                className="flex flex-col items-center gap-1 rounded-xl border border-orange-500/20 bg-orange-500/5 px-3 py-3 text-xs font-semibold text-orange-400 hover:bg-orange-500/10 transition-all"
              >
                <TrendingUp className="h-5 w-5" />
                Racha
              </button>
              <button
                onClick={() => {
                  const title = '👋 Nuevo jugador';
                  const body = 'Carlos se unió a la PollaMax. ¡Dale la bienvenida!';
                  if (isIOS() || !isNotificationSupported()) { showInAppAlert(title, body); return; }
                  if (Notification.permission !== 'granted') { alert('Acepta las notificaciones primero.'); return; }
                  sendBrowserNotification(title, body);
                }}
                className="flex flex-col items-center gap-1 rounded-xl border border-green-500/20 bg-green-500/5 px-3 py-3 text-xs font-semibold text-green-400 hover:bg-green-500/10 transition-all"
              >
                <UserPlus className="h-5 w-5" />
                Nuevo Jugador
              </button>
            </div>
            {!isIOS() && isNotificationSupported() && (
              <button
                onClick={async () => {
                  const perm = await Notification.requestPermission();
                  if (perm === 'granted') {
                    sendBrowserNotification('✅ Notificaciones activadas', 'Ahora recibirás notificaciones de PollaMax.');
                  } else {
                    alert('Permiso denegado. Actívalo manualmente en la configuración del navegador.');
                  }
                }}
                className="w-full rounded-xl border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-xs font-bold text-zinc-300 hover:bg-zinc-700 transition-all"
              >
                Solicitar permiso de notificaciones
              </button>
            )}
          </div>

          {/* Simulación de Cambios en Ranking */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white border-b border-zinc-800/80 pb-2">
              <TrendingUp className="h-5 w-5 text-blue-400" />
              Simular Cambios en Ranking
            </h3>
            <p className="text-xs text-zinc-500">
              Estas herramientas simulan cambios de puntuación para probar las animaciones del podio en la tabla de posiciones.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/world-cup-sync');
                    const data = await res.json();
                    alert(`✅ ${data.message}`);
                  } catch (e) {
                    alert('Error al sincronizar. Revisa la consola.');
                  }
                }}
                className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-4 py-3 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Sincronizar Mundial
              </button>
              <button
                onClick={async () => {
                  if (!user) { alert('Debes iniciar sesión.'); return; }
                  const points = Math.floor(Math.random() * 10) + 1;
                  const batch = writeBatch(db);
                  const userRef = doc(db, 'users', user.uid);
                  batch.update(userRef, { points: increment(points) });
                  try {
                    await batch.commit();
                    alert(`+${points} puntos añadidos a tu perfil. Revisa la tabla de posiciones para ver la animación.`);
                  } catch (err: any) {
                    alert('Error: ' + err.message);
                  }
                }}
                className="flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs font-semibold text-blue-400 hover:bg-blue-500/10 transition-all"
              >
                <UserPlus className="h-4 w-4" />
                Darme +Puntos
              </button>
              <button
                onClick={async () => {
                  try {
                    const usersSnap = await getDocs(collection(db, 'users'));
                    const usersList = usersSnap.docs.map(d => ({ id: d.id, ...d.data() as any }));
                    if (usersList.length < 2) { alert('Se necesitan al menos 2 usuarios.'); return; }
                    const lastUser = usersList[usersList.length - 1];
                    const batch = writeBatch(db);
                    batch.update(doc(db, 'users', lastUser.id), { points: increment(15) });
                    await batch.commit();
                    alert(`+15 puntos para ${lastUser.name}. Debería subir posiciones en el ranking.`);
                  } catch (e: any) {
                    alert('Error: ' + e.message);
                  }
                }}
                className="flex items-center gap-2 rounded-xl border border-purple-500/20 bg-purple-500/5 px-4 py-3 text-xs font-semibold text-purple-400 hover:bg-purple-500/10 transition-all"
              >
                <TrendingUp className="h-4 w-4" />
                Ascender a Último
              </button>
              <button
                onClick={async () => {
                  // Resetear vista del ranking (borrar sessionStorage)
                  for (const key of Object.keys(sessionStorage)) {
                    if (key.startsWith('lastRankOrder_')) {
                      sessionStorage.removeItem(key);
                    }
                  }
                  alert('Se reseteó el historial de animaciones. Al recargar la tabla de posiciones, las animaciones de entrada se reproducirán de nuevo.');
                }}
                className="flex items-center gap-2 rounded-xl border border-zinc-600/40 bg-zinc-800/50 px-4 py-3 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                Resetear Animaciones
              </button>
            </div>
          </div>

          {/* Gestión de Jugadores */}
          <PlayerManager db={db} writeBatch={writeBatch} increment={increment} doc={doc} getDocs={getDocs} collection={collection} />

          {/* Gestión del Feed */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <MessageSquare className="h-5 w-5 text-pink-400" />
                Gestión del Feed
              </h3>
              <div className="flex gap-2">
                <button onClick={handleLoadFeed} disabled={feedLoading} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition-all disabled:opacity-50">
                  {feedLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                  Cargar
                </button>
                <button onClick={handleClearAllFeed} disabled={feedLoading} className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50">
                  <Trash2 className="h-3.5 w-3.5" />
                  Vaciar
                </button>
              </div>
            </div>
            {feedEntries.length > 0 && (
              <p className="text-xs text-zinc-500">{feedEntries.length} entradas cargadas</p>
            )}
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {feedEntries.map((entry: any) => (
                <div key={entry.docId} className="flex items-start gap-3 rounded-xl border border-zinc-800/40 bg-zinc-900/10 px-3.5 py-2.5 group hover:bg-zinc-900/30 transition-all">
                  <div className="h-7 w-7 rounded-full overflow-hidden bg-zinc-800 shrink-0 mt-0.5">
                    {entry.userPhoto ? (
                      <img src={entry.userPhoto} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-[9px] text-zinc-500 font-bold">
                        {entry.userName?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-300">{entry.userName || 'Sistema'}</span>
                      <span className="text-[10px] text-zinc-600">{entry.timestamp ? new Date(entry.timestamp).toLocaleString('es-ES') : ''}</span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{entry.message}</p>
                  </div>
                  <button
                    onClick={() => handleDeleteFeedEntry(entry.docId)}
                    disabled={feedDeleting === entry.docId}
                    className="shrink-0 h-7 w-7 rounded-lg bg-zinc-800/50 text-zinc-500 hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center disabled:opacity-50"
                  >
                    {feedDeleting === entry.docId ? <RefreshCw className="h-3 w-3 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ))}
              {feedEntries.length === 0 && !feedLoading && (
                <div className="text-center py-6 text-zinc-500 text-sm">Haz clic en "Cargar" para ver las entradas del feed.</div>
              )}
              {feedLoading && feedEntries.length === 0 && (
                <div className="text-center py-6 text-zinc-500 text-sm animate-pulse">Cargando...</div>
              )}
            </div>
          </div>

          {/* Gestión de Apuestas */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-white border-b border-zinc-800/80 pb-2">
              <History className="h-5 w-5 text-cyan-400" />
              Gestión de Apuestas
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <select
                  value={selectedBetMatchId}
                  onChange={(e) => { setSelectedBetMatchId(e.target.value); handleLoadBetsForMatch(e.target.value); }}
                  className="flex-1 bg-zinc-950 border border-zinc-800 focus:border-cyan-500 rounded-xl px-3.5 py-2.5 text-sm outline-none text-zinc-300"
                >
                  <option value="">Selecciona un partido...</option>
                  {matches.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.teamA} vs {m.teamB} ({m.status})
                    </option>
                  ))}
                </select>
                {selectedBetMatchId && (
                  <button
                    onClick={() => handleClearBetsForMatch(selectedBetMatchId)}
                    disabled={betsLoading}
                    className="flex items-center gap-1.5 rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-xs font-semibold text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50 shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Vaciar
                  </button>
                )}
              </div>
              {betsLoading && (
                <div className="text-center py-4 text-zinc-500 text-sm animate-pulse">Cargando apuestas...</div>
              )}
              <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                {betsForMatch.map((bet: any) => (
                  <div key={bet.docId} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/40 bg-zinc-900/10 px-3.5 py-2.5 group hover:bg-zinc-900/30 transition-all">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="h-7 w-7 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                        {bet.userPhoto ? (
                          <img src={bet.userPhoto} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[9px] text-zinc-500 font-bold">
                            {bet.userName?.slice(0, 2).toUpperCase() || '??'}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-semibold text-zinc-300 truncate">{bet.userName}</span>
                      <span className="text-sm font-black text-emerald-400">{bet.predA} - {bet.predB}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${bet.processed ? 'bg-zinc-700 text-zinc-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {bet.processed ? 'Procesada' : 'Pendiente'}
                      </span>
                      {bet.pointsEarned != null && (
                        <span className="text-xs font-bold text-emerald-500">+{bet.pointsEarned} pts</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteBet(bet.docId)}
                      disabled={betDeleting === bet.docId}
                      className="shrink-0 h-7 w-7 rounded-lg bg-zinc-800/50 text-zinc-500 hover:bg-red-500/20 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center disabled:opacity-50"
                    >
                      {betDeleting === bet.docId ? <RefreshCw className="h-3 w-3 animate-spin" /> : <X className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                ))}
                {selectedBetMatchId && betsForMatch.length === 0 && !betsLoading && (
                  <div className="text-center py-4 text-zinc-500 text-sm">No hay apuestas para este partido.</div>
                )}
              </div>
            </div>
          </div>

          {/* Gestión de Usuarios */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <Users className="h-5 w-5 text-violet-400" />
                Gestión de Usuarios
              </h3>
              <button onClick={handleLoadUsers} disabled={usersLoading} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition-all disabled:opacity-50">
                {usersLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
                Cargar
              </button>
            </div>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
              {allUsers.map((u: any) => (
                <div key={u.docId} className="flex items-center justify-between gap-2 rounded-xl border border-zinc-800/40 bg-zinc-900/10 px-3.5 py-2 group hover:bg-zinc-900/30 transition-all">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="h-7 w-7 rounded-full overflow-hidden bg-zinc-800 shrink-0">
                      {u.photoURL ? (
                        <img src={u.photoURL} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-[9px] text-zinc-500 font-bold">{u.name?.slice(0, 2).toUpperCase() || '??'}</div>
                      )}
                    </div>
                    <span className="text-sm font-semibold text-zinc-300 truncate">{u.name}</span>
                    <span className="text-xs font-bold text-emerald-400">{u.points ?? 0} pts</span>
                    {u.isAdmin && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold">Admin</span>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleToggleAdmin(u.docId, u.isAdmin)}
                      disabled={userActionLoading === u.docId}
                      className="h-7 px-2 rounded-lg bg-zinc-800/50 text-zinc-500 hover:bg-amber-500/10 hover:text-amber-400 text-[10px] font-bold transition-all disabled:opacity-50 flex items-center gap-1"
                      title={u.isAdmin ? 'Quitar admin' : 'Hacer admin'}
                    >
                      {u.isAdmin ? <EyeOff className="h-3 w-3" /> : <ShieldAlert className="h-3 w-3" />}
                    </button>
                    <button
                      onClick={() => handleSetUserPoints(u.docId, u.name)}
                      disabled={userActionLoading === u.docId}
                      className="h-7 px-2 rounded-lg bg-zinc-800/50 text-zinc-500 hover:bg-emerald-500/10 hover:text-emerald-400 text-[10px] font-bold transition-all disabled:opacity-50"
                      title="Cambiar puntos"
                    >
                      <Settings className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(u.docId, u.name)}
                      disabled={userActionLoading === u.docId}
                      className="h-7 w-7 rounded-lg bg-zinc-800/50 text-zinc-500 hover:bg-red-500/20 hover:text-red-400 transition-all disabled:opacity-50 flex items-center justify-center"
                      title="Eliminar usuario"
                    >
                      {userActionLoading === u.docId ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
              {allUsers.length === 0 && !usersLoading && (
                <div className="text-center py-6 text-zinc-500 text-sm">Haz clic en "Cargar" para ver los usuarios.</div>
              )}
              {usersLoading && allUsers.length === 0 && (
                <div className="text-center py-6 text-zinc-500 text-sm animate-pulse">Cargando...</div>
              )}
            </div>
          </div>

          {/* Firebase Stats */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
              <h3 className="text-lg font-bold flex items-center gap-2 text-white">
                <Database className="h-5 w-5 text-green-400" />
                Firebase: Datos y Configuración
              </h3>
              <button onClick={handleLoadFirebaseStats} className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-700 transition-all">
                <Eye className="h-3.5 w-3.5" />
                Ver stats
              </button>
            </div>
            {Object.keys(firebaseStats).length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {Object.entries(firebaseStats).map(([col, count]) => (
                  <div key={col} className="rounded-xl border border-zinc-800/50 bg-zinc-900/20 px-3 py-2 text-center">
                    <span className="text-[10px] text-zinc-500 block uppercase tracking-wider">{col}</span>
                    <span className="text-lg font-extrabold text-white">{count}</span>
                  </div>
                ))}
              </div>
            )}
            {configData && (
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/20 p-3">
                <button onClick={() => setShowConfig(!showConfig)} className="flex items-center gap-2 text-xs font-bold text-zinc-400 hover:text-white transition-all">
                  <FileText className="h-3.5 w-3.5" />
                  Config: tournamentResults
                  {showConfig ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
                {showConfig && (
                  <pre className="mt-2 text-[10px] text-zinc-500 bg-zinc-950 rounded-lg p-3 overflow-x-auto max-h-[200px] whitespace-pre-wrap">
                    {JSON.stringify(configData, null, 2)}
                  </pre>
                )}
              </div>
            )}
            <button
              onClick={handleClearCache}
              className="w-full flex items-center justify-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-2.5 text-xs font-semibold text-orange-400 hover:bg-orange-500/10 transition-all"
            >
              <Trash2 className="h-4 w-4" />
              Limpiar Caché (worldCupCache)
            </button>
          </div>

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

// Componente de gestión de jugadores con +/- puntos
function PlayerManager({
  db: dbInst,
  writeBatch: wb,
  increment: inc,
  doc: d,
  getDocs: gd,
  collection: col,
}: {
  db: any;
  writeBatch: any;
  increment: any;
  doc: any;
  getDocs: any;
  collection: any;
}) {
  const [players, setPlayers] = useState<any[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);
  const [adjusting, setAdjusting] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const snap = await gd(col(dbInst, 'users'));
        const list = snap.docs
          .map((d: any) => ({ id: d.id, ...d.data() }))
          .sort((a: any, b: any) => (b.points || 0) - (a.points || 0));
        setPlayers(list);
      } catch (e) {
        console.error('Error loading players:', e);
      } finally {
        setLoadingPlayers(false);
      }
    };
    load();
  }, [dbInst, col, gd]);

  const adjustPoints = async (userId: string, amount: number) => {
    setAdjusting(userId);
    try {
      const batch = wb(dbInst);
      batch.update(d(dbInst, 'users', userId), { points: inc(amount) });
      await batch.commit();
      setPlayers(prev =>
        prev.map(p =>
          p.id === userId ? { ...p, points: (p.points || 0) + amount } : p
        ).sort((a: any, b: any) => (b.points || 0) - (a.points || 0))
      );
    } catch (e) {
      console.error('Error adjusting points:', e);
      alert('Error al ajustar puntos.');
    } finally {
      setAdjusting(null);
    }
  };

  if (loadingPlayers) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/20 p-5 text-center text-xs text-zinc-500 animate-pulse">
        Cargando jugadores...
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 space-y-3">
      <h3 className="text-lg font-bold flex items-center gap-2 text-white border-b border-zinc-800/80 pb-2">
        <Users className="h-5 w-5 text-blue-400" />
        Gestión de Jugadores ({players.length})
      </h3>
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {players.map((player, idx) => (
          <div
            key={player.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-zinc-800/60 bg-zinc-900/20 px-4 py-2.5"
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="text-xs font-bold text-zinc-500 w-5 text-center shrink-0">#{idx + 1}</span>
              <div className="h-7 w-7 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0">
                {player.photoURL ? (
                  <img src={player.photoURL} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-[9px] text-zinc-400">{player.name?.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <span className="text-sm font-semibold text-white truncate">{player.name}</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-sm font-black text-emerald-400 w-12 text-right">{player.points ?? 0}</span>
              <button
                onClick={() => adjustPoints(player.id, -5)}
                disabled={adjusting === player.id}
                className="h-8 w-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 font-bold text-sm flex items-center justify-center transition-all disabled:opacity-40"
                title="Restar 5 puntos"
              >
                −5
              </button>
              <button
                onClick={() => adjustPoints(player.id, -1)}
                disabled={adjusting === player.id}
                className="h-8 w-8 rounded-lg bg-red-500/5 border border-red-500/10 text-red-400/70 hover:bg-red-500/15 font-bold text-sm flex items-center justify-center transition-all disabled:opacity-40"
                title="Restar 1 punto"
              >
                −1
              </button>
              <button
                onClick={() => adjustPoints(player.id, 1)}
                disabled={adjusting === player.id}
                className="h-8 w-8 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-emerald-400/70 hover:bg-emerald-500/15 font-bold text-sm flex items-center justify-center transition-all disabled:opacity-40"
                title="Sumar 1 punto"
              >
                +1
              </button>
              <button
                onClick={() => adjustPoints(player.id, 5)}
                disabled={adjusting === player.id}
                className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 font-bold text-sm flex items-center justify-center transition-all disabled:opacity-40"
                title="Sumar 5 puntos"
              >
                +5
              </button>
              {adjusting === player.id && (
                <RefreshCw className="h-4 w-4 animate-spin text-zinc-500" />
              )}
            </div>
          </div>
        ))}
        {players.length === 0 && (
          <div className="text-center py-6 text-zinc-500 text-sm">No hay jugadores registrados.</div>
        )}
      </div>
    </div>
  );
}
