"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { COUNTRIES } from '@/lib/countries';
import { Check, X } from 'lucide-react';

export const UserSettings: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const { user, profile } = useAuth();
  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
    try {
      const userRef = doc(db, 'users', user.uid);

      const updates: any = { name, country };

      if (file) {
        const storageRef = ref(storage, `avatars/${user.uid}_${Date.now()}`);
        await uploadBytes(storageRef, file);
        const url = await getDownloadURL(storageRef);
        updates.photoURL = url;
      }

      await updateDoc(userRef, updates);
      onClose();
    } catch (err) {
      console.error('Error saving user settings', err);
      alert('Error al guardar la configuración. Inténtalo de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Configuración de Usuario</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400">Nombre</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full mt-1 rounded-xl px-3 py-2 bg-zinc-950 border border-zinc-800 outline-none" />
          </div>

          <div>
            <label className="text-xs text-zinc-400">Foto de perfil</label>
            <div className="mt-2 flex items-center gap-3">
              <div className="h-12 w-12 rounded-full overflow-hidden bg-zinc-800 flex items-center justify-center">
                {preview ? <img src={preview} alt="preview" className="h-full w-full object-cover" /> : <span className="text-zinc-400">IMG</span>}
              </div>
              <input type="file" accept="image/*" onChange={handleFile} />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400">País</label>
            <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full mt-1 rounded-xl px-3 py-2 bg-zinc-950 border border-zinc-800 outline-none">
              <option value="">Selecciona tu país (opcional)</option>
              {COUNTRIES.map(c => (
                <option key={c.code} value={c.name}>{c.flag} {c.name}</option>
              ))}
            </select>
          </div>

          <div className="text-xs text-zinc-500">
            Esta web recopila tu nombre, foto de perfil y país para mostrar en el ranking y el feed. Los datos se usan únicamente para la experiencia dentro de la polla familiar.
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400">Desarrollador: Santiago Neuta</span>
            <div className="flex items-center gap-2">
              <button onClick={onClose} className="px-3 py-1 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="px-3 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white flex items-center gap-2">
                {saving ? 'Guardando...' : (<><Check className="h-4 w-4" />Guardar</>)}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserSettings;
