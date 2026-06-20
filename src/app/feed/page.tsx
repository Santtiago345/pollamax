'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { RefreshCw, ClipboardList, Activity, Clock } from 'lucide-react';

interface HistoryEntry {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: string;
}

export default function FeedPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
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
        <div className="relative pl-6 border-l border-zinc-800 space-y-6">
          {history.map((entry) => (
            <div key={entry.id} className="relative group">
              {/* Círculo indicador del feed */}
              <span className="absolute -left-[31px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-zinc-950 border-2 border-zinc-800 group-hover:border-emerald-500 transition-colors">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 group-hover:bg-emerald-400 transition-colors"></span>
              </span>

              {/* Contenedor del Mensaje */}
              <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 p-4 transition-all hover:bg-zinc-900/35 hover:border-zinc-800">
                <div className="flex justify-between items-start gap-4">
                  <p className="text-sm text-zinc-200 leading-relaxed font-medium">
                    {entry.message}
                  </p>
                  
                  <span className="flex items-center gap-1 text-[10px] text-zinc-500 whitespace-nowrap bg-zinc-950 px-2 py-0.5 rounded-full border border-zinc-900 font-semibold">
                    <Clock className="h-3 w-3" />
                    {formatTimeAgo(entry.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
