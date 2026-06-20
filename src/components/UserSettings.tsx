"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { COUNTRIES } from '@/lib/countries';
import { Check, X, Camera, Loader2 } from 'lucide-react';

export const UserSettings: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { user, profile } = useAuth();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setCountry((profile as any).country || '');
      setPreview((profile as any).photoURL || null);
    }
  }, [profile]);

  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!open || !user) return null;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (f) setFile(f);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    setUploadProgress(false);
    try {
      const userRef = doc(db, 'users', user.uid);
      const updates: any = { name, country };

      if (file) {
        setUploadProgress(true);
        const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        updates.photoURL = url;
        setUploadProgress(false);
      }

      await updateDoc(userRef, updates);
      setFile(null);
      onClose();
    } catch (err: any) {
      console.error('Error saving user settings', err);
      if (err?.code === 'storage/unauthorized') {
        alert('No tienes permiso para subir archivos. Configura las reglas de Storage en Firebase Console.');
      } else if (err?.code === 'storage/canceled') {
        alert('La subida fue cancelada. Inténtalo de nuevo.');
      } else if (err?.message?.includes('permission')) {
        alert('Error de permisos. Verifica las reglas de Firebase Storage.');
      } else {
        alert('Error al guardar la configuración. Inténtalo de nuevo.');
      }
    } finally {
      setSaving(false);
      setUploadProgress(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start sm:items-center justify-center p-4 bg-black/70 overflow-y-auto pt-12 sm:pt-4">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Configuración de Usuario</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 font-semibold">Nombre</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full mt-1 rounded-xl px-3 py-2 bg-zinc-950 border border-zinc-800 outline-none focus:border-emerald-500 transition-colors text-white"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 font-semibold">Foto de perfil</label>
            <div className="mt-2 flex items-center gap-4">
              <div className="h-14 w-14 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center shrink-0 border-2 border-zinc-700">
                {preview ? (
                  <img src={preview} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-5 w-5 text-zinc-500" />
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold transition-all border border-zinc-700 disabled:opacity-50"
              >
                {file ? 'Cambiar foto' : 'Seleccionar foto'}
              </button>
              {file && (
                <button
                  type="button"
                  onClick={() => { setFile(null); setPreview(profile?.photoURL || null); }}
                  className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
                >
                  Quitar
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 font-semibold">País</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full mt-1 rounded-xl px-3 py-2 bg-zinc-950 border border-zinc-800 outline-none focus:border-emerald-500 transition-colors text-white"
            >
              <option value="">Selecciona tu país (opcional)</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>

          <div className="text-xs text-zinc-500 bg-zinc-950/50 rounded-xl p-3 border border-zinc-800/50">
            Esta web recopila tu nombre, foto de perfil y país para mostrar en el ranking y el feed. Los datos se usan únicamente para la experiencia dentro de la polla familiar.
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-zinc-500">Desarrollador: Santiago Neuta</span>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold transition-all disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />{uploadProgress ? 'Subiendo foto...' : 'Guardando...'}</>
                ) : (
                  <><Check className="h-4 w-4" />Guardar</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
