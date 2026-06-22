'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import UserSettings from '@/components/UserSettings';
import { Trophy, Menu, X, LogOut, Swords, ListOrdered, ClipboardList, ShieldCheck, Home, Globe, Settings } from 'lucide-react';
import StreakBadge from '@/components/StreakBadge';
import AnnouncementDropdown from '@/components/AnnouncementDropdown';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const Navbar: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [navVisibility, setNavVisibility] = useState<Record<string, boolean> | null>(null);
  const pathname = usePathname();

    // Bloquear scroll del fondo cuando el menú móvil está abierto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  // Leer visibilidad de pestañas desde config
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'navVisibility'), (snap) => {
      if (snap.exists()) setNavVisibility(snap.data() as Record<string, boolean>);
      else setNavVisibility({});
    }, () => setNavVisibility({}));
    return () => unsub();
  }, []);

  if (!user) return null;

  const allLinks = [
    { href: '/', label: 'Inicio', icon: Home, key: 'home' },
    { href: '/matches', label: 'Partidos', icon: Swords, key: 'matches' },
    { href: '/mundial', label: 'Mundial', icon: Globe, key: 'mundial' },
    { href: '/ranking', label: 'Posiciones', icon: ListOrdered, key: 'ranking' },
    { href: '/podium', label: 'Podio', icon: Trophy, key: 'podium' },
    { href: '/feed', label: 'Feed', icon: ClipboardList, key: 'feed' },
  ];

  const navLinks = allLinks.filter(link => link.key === 'home' || !navVisibility || navVisibility[link.key] !== false);

  if (profile?.isAdmin) {
    navLinks.push({ href: '/admin', label: 'Admin', icon: ShieldCheck, key: 'admin' });
  }

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const streakType = profile?.streak?.type || null;
  const streakCount = profile?.streak?.count ?? 0;

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            {/* Logo y Enlaces de Escritorio */}
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-600 to-emerald-400">
                  <Trophy className="h-5 w-5 text-amber-300" />
                </div>
                <span className="text-xl font-black tracking-tight text-white">
                  Polla<span className="text-emerald-400">Max</span>
                </span>
              </Link>

              {/* Links Escritorio */}
              <div className="hidden md:flex items-center gap-1.5">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="rounded-xl"
                    >
                      <Link
                        href={link.href}
                        className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Información del usuario y botón Logout */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-white max-w-[150px] truncate">{profile?.name}</span>
                <div className="flex items-center gap-2 mt-0.5">
                <Link href="/#puntos" className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full hover:bg-amber-500/20 hover:border-amber-500/50 transition-all cursor-pointer">
                  {profile?.points ?? 0} Pts
                </Link>
                <Link href="/#rachas"><StreakBadge type={streakType} count={streakCount} small /></Link>
                </div>
              </div>

              <AnnouncementDropdown />
              <motion.button
                onClick={logout}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-950 transition-all active:scale-95"
                title="Cerrar sesión"
              >
                <LogOut className="h-5 w-5" />
              </motion.button>
              <motion.button
                onClick={() => setSettingsOpen(true)}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-950 transition-all active:scale-95"
                title="Configuración"
              >
                <Settings className="h-5 w-5" />
              </motion.button>
            </div>

            {/* Botón menú móvil */}
            <div className="flex md:hidden items-center gap-3">
              <div className="flex flex-col items-end mr-1">
                <span className="text-xs font-bold text-white max-w-[100px] truncate">{profile?.name}</span>
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-full">
                  {profile?.points ?? 0} Pts
                </span>
              </div>

              <motion.button
                onClick={toggleMobileMenu}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </motion.button>
            </div>
          </div>
        </div>

        {/* Menú Móvil Animado */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="md:hidden overflow-hidden border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-lg"
            >
              <div className="space-y-1.5 px-4 pb-4 pt-2">
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: navLinks.indexOf(link) * 0.03 }}
                    >
                      <Link
                        href={link.href}
                        onClick={closeMobileMenu}
                        className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition-all ${isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                          }`}
                      >
                        <Icon className="h-5 w-5" />
                        {link.label}
                      </Link>
                    </motion.div>
                  );
                })}
                <motion.button
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: navLinks.length * 0.03 }}
                  onClick={() => {
                    closeMobileMenu();
                    logout();
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
                >
                  <LogOut className="h-5 w-5" />
                  Cerrar Sesión
                </motion.button>
                <motion.div
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: (navLinks.length + 1) * 0.03 }}
                  className="flex items-center gap-3 rounded-xl px-4 py-3"
                >
                  <AnnouncementDropdown />
                  <span className="text-base font-semibold text-zinc-300">Anuncios</span>
                </motion.div>
                <motion.button
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.15, delay: (navLinks.length + 2) * 0.03 }}
                  onClick={() => { closeMobileMenu(); setSettingsOpen(true); }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-zinc-300 hover:bg-zinc-900/20 transition-all"
                >
                  <Settings className="h-5 w-5" />
                  Configuración
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
      {/* UserSettings FUERA del <nav> para evitar problemas de z-index */}
      <UserSettings open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
};
