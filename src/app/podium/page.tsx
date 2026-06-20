'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { COUNTRIES } from '@/lib/countries';
import { doc, updateDoc, collection, query, orderBy, limit, getDocs, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Trophy, RefreshCw, AlertCircle, Save, CheckCircle2 } from 'lucide-react';

export default function PodiumPage() {
  const { user, profile } = useAuth();
  
  const [champion, setChampion] = useState('');
  const [runnerUp, setRunnerUp] = useState('');
  const [thirdPlace, setThirdPlace] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [locked, setLocked] = useState(false);
  const [firstMatchDate, setFirstMatchDate] = useState<Date | null>(null);

  // 1. Cargar las predicciones previas del usuario y verificar bloqueo
  useEffect(() => {
    if (!profile) return;

    if (profile.predictions) {
      setChampion(profile.predictions.champion || '');
      setRunnerUp(profile.predictions.runnerUp || '');
      setThirdPlace(profile.predictions.thirdPlace || '');
    }

    const checkLockStatus = async () => {
      try {
        // Consultar el primer partido del mundial (el que tenga la fecha más antigua)
        const matchesRef = collection(db, 'matches');
        const q = query(matchesRef, orderBy('date', 'asc'), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const firstMatchDoc = querySnapshot.docs[0].data();
          const matchDate = new Date(firstMatchDoc.date);
          setFirstMatchDate(matchDate);
          
          // Bloquear si la hora actual es posterior al inicio del primer partido
          const now = new Date();
          if (now >= matchDate) {
            setLocked(true);
          }
        }
      } catch (error) {
        console.error('Error checking first match date:', error);
      } finally {
        setLoading(false);
      }
    };

    checkLockStatus();
  }, [profile]);

  const handleSavePodium = async () => {
    if (!user || locked) return;

    if (!champion || !runnerUp || !thirdPlace) {
      alert('Debes seleccionar las tres posiciones del podio.');
      return;
    }

    if (champion === runnerUp || champion === thirdPlace || runnerUp === thirdPlace) {
      alert('No puedes elegir el mismo país para más de una posición.');
      return;
    }

    setSaving(true);
    setSuccess(false);

    try {
      const userRef = doc(db, 'users', user.uid);
      
      const predictions = {
        champion,
        runnerUp,
        thirdPlace,
        submittedAt: new Date().toISOString(),
      };

      await updateDoc(userRef, { predictions });

      // Guardar en el feed de actividad
      const historyRef = collection(db, 'history');
      await addDoc(historyRef, {
        userId: user.uid,
        userName: profile?.name || 'Usuario',
        message: `${profile?.name} actualizó sus predicciones de Podio (1°: ${champion}, 2°: ${runnerUp}, 3°: ${thirdPlace})`,
        timestamp: new Date().toISOString(),
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error('Error saving podium predictions:', error);
      alert('Hubo un error al guardar tu podio. Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-zinc-950 text-white">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-10 w-10 animate-spin text-emerald-400" />
          <p className="text-sm font-medium text-emerald-400/80 animate-pulse">Cargando podio...</p>
        </div>
      </div>
    );
  }

  // Filtrar los países seleccionados en otros selectores
  const getFilteredCountries = (exclude1: string, exclude2: string) => {
    return COUNTRIES.filter(c => c.name !== exclude1 && c.name !== exclude2);
  };

  return (
    <div className="py-6 px-4 max-w-2xl mx-auto space-y-8 bg-zinc-950 text-white min-h-[85vh]">
      {/* Cabecera */}
      <div className="border-b border-zinc-800 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Trophy className="h-7 w-7 text-amber-400" />
          Predicciones de Podio
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Define quién crees que ganará el Mundial, quién será segundo y quién tercero antes de que comience el torneo.
        </p>
      </div>

      {locked && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-400">Predicciones bloqueadas</h4>
            <p className="text-xs text-zinc-400 mt-1">
              El torneo ya comenzó (primer partido: {firstMatchDate?.toLocaleString('es-ES')}). No se permiten más cambios.
            </p>
          </div>
        </div>
      )}

      {/* Tarjetas del Podio */}
      <div className="space-y-6">
        {/* Campeón */}
        <div className="relative rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-amber-400 text-black shadow-lg shadow-amber-400/20">
              <Trophy className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-black text-amber-200">Campeón del Mundial</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Otorga 25 puntos en caso de acierto.</p>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <select
              value={champion}
              disabled={locked}
              onChange={(e) => setChampion(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition-all disabled:opacity-60"
            >
              <option value="">Selecciona Campeón...</option>
              {getFilteredCountries(runnerUp, thirdPlace).map((country) => (
                <option key={country.code} value={country.name}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Subcampeón */}
        <div className="relative rounded-2xl border border-zinc-500/20 bg-zinc-500/5 p-6 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-400 text-black shadow-lg">
              <Trophy className="h-7 w-7 text-zinc-800" />
            </div>
            <div>
              <h3 className="text-lg font-black text-zinc-300">Subcampeón</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Otorga 17 puntos en caso de acierto.</p>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <select
              value={runnerUp}
              disabled={locked}
              onChange={(e) => setRunnerUp(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition-all disabled:opacity-60"
            >
              <option value="">Selecciona Subcampeón...</option>
              {getFilteredCountries(champion, thirdPlace).map((country) => (
                <option key={country.code} value={country.name}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tercer Puesto */}
        <div className="relative rounded-2xl border border-orange-700/20 bg-orange-700/5 p-6 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-700 text-white shadow-lg">
              <Trophy className="h-7 w-7 text-orange-200" />
            </div>
            <div>
              <h3 className="text-lg font-black text-orange-300">Tercer Puesto</h3>
              <p className="text-xs text-zinc-400 mt-0.5">Otorga 13 puntos en caso de acierto.</p>
            </div>
          </div>

          <div className="w-full sm:w-64">
            <select
              value={thirdPlace}
              disabled={locked}
              onChange={(e) => setThirdPlace(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 rounded-xl px-4 py-3 text-sm font-semibold outline-none transition-all disabled:opacity-60"
            >
              <option value="">Selecciona Tercer Puesto...</option>
              {getFilteredCountries(champion, runnerUp).map((country) => (
                <option key={country.code} value={country.name}>
                  {country.flag} {country.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Botón Guardar */}
      {!locked && (
        <div className="flex items-center gap-4 pt-4">
          <button
            onClick={handleSavePodium}
            disabled={saving || !champion || !runnerUp || !thirdPlace}
            className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40"
          >
            {saving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Guardar Predicciones
          </button>
          
          {success && (
            <div className="flex items-center gap-1.5 text-sm text-emerald-400 animate-in fade-in slide-in-from-left duration-200">
              <CheckCircle2 className="h-4 w-4" /> Predicciones guardadas con éxito
            </div>
          )}
        </div>
      )}
    </div>
  );
}
