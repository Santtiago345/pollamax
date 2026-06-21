'use client';

import { useAuth } from './AuthProvider';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export function FirestoreBlockedBanner() {
  const { firestoreBlocked } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!firestoreBlocked || dismissed) return null;

  return (
    <div className="bg-red-600/90 backdrop-blur-sm text-white px-4 py-2.5 text-xs sm:text-sm shadow-lg relative z-50">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <p className="flex-1">
          <strong>Firebase bloqueado:</strong> Las reglas de seguridad de Firestore impiden guardar datos.
          Ve a{' '}
          <a
            href="https://console.firebase.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-bold hover:text-red-200"
          >
            Firebase Console
          </a>
          {' '}→ Firestore → Reglas y pega las reglas del archivo <code className="bg-red-900/50 px-1 rounded text-[10px]">firestore.rules</code> del proyecto.
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 rounded-full p-1 hover:bg-red-700/50 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
