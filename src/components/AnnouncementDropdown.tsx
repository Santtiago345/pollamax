'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Bell, X, Megaphone } from 'lucide-react';
import { useAuth } from '@/components/AuthProvider';

interface Announcement {
  id: string;
  message: string;
  createdAt: string;
  createdBy: string;
  createdByName: string;
}

export default function AnnouncementDropdown() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [open, setOpen] = useState(false);
  const [lastSeen, setLastSeen] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'announcements'), orderBy('createdAt', 'desc'), limit(20));
    const unsub = onSnapshot(q, (snap) => {
      const list: Announcement[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() as any }));
      setAnnouncements(list);
    });
    return () => unsub();
  }, [user]);

  useEffect(() => {
    const stored = localStorage.getItem('announcements_last_seen');
    if (stored) setLastSeen(stored);
  }, []);

  const unreadCount = announcements.filter(a => !lastSeen || a.createdAt > lastSeen).length;

  useEffect(() => {
    if (open && announcements.length > 0) {
      const latest = announcements[0].createdAt;
      localStorage.setItem('announcements_last_seen', latest);
      setLastSeen(latest);
    }
  }, [open, announcements]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-950 transition-all active:scale-95"
        title="Anuncios"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-pink-500 text-[9px] font-bold text-white shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-zinc-800 bg-zinc-900 shadow-2xl shadow-black/50 overflow-hidden z-50"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Megaphone className="h-4 w-4 text-pink-400" />
                Anuncios
              </h3>
              <button onClick={() => setOpen(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-zinc-800/50">
              {announcements.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-zinc-500">
                  No hay anuncios por el momento.
                </div>
              ) : (
                announcements.map((a) => {
                  const isNew = !lastSeen || a.createdAt > lastSeen;
                  return (
                    <div key={a.id} className={`px-4 py-3 ${isNew ? 'bg-pink-500/5' : ''}`}>
                      <div className="flex items-start gap-2">
                        <span className="text-xs mt-0.5 shrink-0">{isNew ? '🆕' : '📢'}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-zinc-200 leading-relaxed">{a.message}</p>
                          <p className="text-[10px] text-zinc-600 mt-1">
                            {a.createdByName} · {new Date(a.createdAt).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
