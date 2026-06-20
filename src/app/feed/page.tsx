'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RefreshCw, ClipboardList, Activity, Clock, Flame } from 'lucide-react';
import StreakBadge from '@/components/StreakBadge';

interface HistoryEntry {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string | null;
  message: string;
  timestamp: string;
}

export default function FeedPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [users, setUsers] = useState<Array<{ uid: string; name: string; photoURL?: string; points?: number; streak?: { type: 'exact' | 'winner' | null; count: number } }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Consultar las últimas 50 entradas del feed de actividad
    const q = query(
      collection(db, 'history'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const historyList: HistoryEntry[] = [];
        snapshot.forEach((doc) => {
          historyList.push({ id: doc.id, ...doc.data() } as HistoryEntry);
        });
        setHistory(historyList);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching activity feed:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Obtener lista de usuarios registrados para mostrar en el encabezado del feed
  useEffect(() => {
    const q = query(collection(db, 'users'), orderBy('points', 'desc'));
    const unsubscribeUsers = onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach((d) => list.push({ uid: d.id, ...d.data() }));
      setUsers(list);
    }, (err) => console.error('Error fetching users for feed:', err));

    return () => unsubscribeUsers();
  }, []);

  // Función para formatear el tiempo transcurrido (hace X minutos)
  const formatTimeAgo = (timestampStr: string) => {
    try {
      const date = new Date(timestampStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Hace un momento';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
      if (diffDays === 1) return 'Ayer';
      
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-10 w-10 animate-spin text-emerald-400" />
          <p className="text-sm font-medium text-emerald-400/80 animate-pulse">Cargando feed...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 max-w-2xl mx-auto space-y-8 bg-zinc-950 text-white min-h-[85vh]">
      {/* Cabecera */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight">Historial de Actividad</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Feed en tiempo real de apuestas y actualizaciones de la polla familiar.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/10 p-12 text-center">
          <ClipboardList className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-zinc-300">No hay actividad reciente</h3>
          <p className="text-zinc-500 text-sm mt-2">
            La actividad de apuestas se mostrará aquí tan pronto como los usuarios comiencen a jugar.
          </p>
        </div>
      ) : (
        <>
        <div className="flex items-center gap-3 overflow-x-auto pb-4">
          {users.map((u) => (
            <div key={u.uid} className="flex items-center gap-2 px-2 shrink-0">
              <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden">
                {u.photoURL ? <img src={u.photoURL} alt={u.name} className="h-full w-full object-cover" /> : <span className="text-xs text-zinc-400">{u.name.slice(0,2).toUpperCase()}</span>}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-zinc-300 font-semibold leading-tight">{u.name.split(' ')[0]}</span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-amber-400 font-bold">{u.points ?? 0}</span>
                  <StreakBadge type={u.streak?.type || null} count={u.streak?.count ?? 0} small />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="relative pl-6 border-l border-zinc-800 space-y-6">
          <AnimatePresence>
            {history.map((entry) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28 }}
                className="relative group"
              >
                {['racha', 'Racha'].some(w => entry.message.includes(w)) ? (
                  <StreakFeedItem entry={entry} formatTimeAgo={formatTimeAgo} />
                ) : (
                  <NormalFeedItem entry={entry} formatTimeAgo={formatTimeAgo} />
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        </>
      )}
    </div>
  );
}

function NormalFeedItem({ entry, formatTimeAgo }: { entry: HistoryEntry; formatTimeAgo: (t: string) => string }) {
  return (
    <>
      <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-950 border-2 border-zinc-800 group-hover:border-emerald-500 transition-colors">
        <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 group-hover:bg-emerald-400 transition-colors"></span>
      </span>
      <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 p-4 transition-all hover:bg-zinc-900/35 hover:border-zinc-800">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center shrink-0">
              {entry.userPhoto ? (
                <img src={entry.userPhoto} alt={entry.userName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-zinc-400">{entry.userName?.slice(0,2).toUpperCase()}</span>
              )}
            </div>
            <p className="text-sm text-zinc-200 leading-relaxed font-medium">{entry.message}</p>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-zinc-500 whitespace-nowrap bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-900 font-semibold shrink-0">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(entry.timestamp)}
          </span>
        </div>
      </div>
    </>
  );
}

function StreakFeedItem({ entry, formatTimeAgo }: { entry: HistoryEntry; formatTimeAgo: (t: string) => string }) {
  return (
    <>
      <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-950 border-2 border-orange-500 transition-colors">
        <span className="h-1.5 w-1.5 rounded-full bg-orange-400"></span>
      </span>
      <div className="rounded-xl border border-orange-500/30 bg-gradient-to-r from-orange-500/5 to-transparent p-4 transition-all hover:bg-orange-500/10">
        <div className="flex justify-between items-start gap-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-full overflow-hidden bg-zinc-900 flex items-center justify-center shrink-0">
              {entry.userPhoto ? (
                <img src={entry.userPhoto} alt={entry.userName} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs text-zinc-400">{entry.userName?.slice(0,2).toUpperCase()}</span>
              )}
            </div>
            <motion.div initial={{ rotate: -15, scale: 0.8 }} animate={{ rotate: 0, scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
              <Flame className="h-5 w-5 text-orange-400 shrink-0 mt-0.5" />
            </motion.div>
            <p className="text-sm leading-relaxed font-medium text-orange-200">{entry.message}</p>
          </div>
          <span className="flex items-center gap-1 text-[10px] text-zinc-500 whitespace-nowrap bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-900 font-semibold shrink-0">
            <Clock className="h-3 w-3" />
            {formatTimeAgo(entry.timestamp)}
          </span>
        </div>
      </div>
    </>
  );
}
