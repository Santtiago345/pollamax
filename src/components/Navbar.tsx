'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import { Trophy, Menu, X, LogOut, Swords, ListOrdered, ClipboardList, ShieldCheck, Home } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, profile, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  if (!user) return null; // No mostrar navbar si no está logueado

  const navLinks = [
    { href: '/', label: 'Inicio', icon: Home },
    { href: '/matches', label: 'Partidos', icon: Swords },
    { href: '/ranking', label: 'Posiciones', icon: ListOrdered },
    { href: '/podium', label: 'Podio', icon: Trophy },
    { href: '/feed', label: 'Feed', icon: ClipboardList },
  ];

  if (profile?.isAdmin) {
    navLinks.push({ href: '/admin', label: 'Admin', icon: ShieldCheck });
  }

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
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
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'text-zinc-400 hover:text-white hover:bg-zinc-900/50'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Información del usuario y botón Logout */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-white max-w-[150px] truncate">{profile?.name}</span>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full mt-0.5">
                {profile?.points ?? 0} Pts
              </span>
            </div>
            
            <button
              onClick={logout}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 text-zinc-400 hover:text-white hover:bg-zinc-950 transition-all active:scale-95"
              title="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          {/* Botón menú móvil */}
          <div className="flex md:hidden items-center gap-3">
            <div className="flex flex-col items-end mr-1">
              <span className="text-xs font-bold text-white max-w-[100px] truncate">{profile?.name}</span>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded-full">
                {profile?.points ?? 0} Pts
              </span>
            </div>

            <button
              onClick={toggleMobileMenu}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-lg animate-in fade-in slide-in-from-top duration-200">
          <div className="space-y-1.5 px-4 pb-4 pt-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}
            <button
              onClick={() => {
                closeMobileMenu();
                logout();
              }}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
            >
              <LogOut className="h-5 w-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};
