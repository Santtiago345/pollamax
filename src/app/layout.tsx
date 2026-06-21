import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Navbar } from '@/components/Navbar';
import AnimatedLayout from '@/components/AnimatedLayout';
import { NotificationBanner } from '@/components/NotificationBanner';
import { NotificationService } from '@/components/NotificationService';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { Analytics } from "@vercel/analytics/next"
import Link from 'next/link';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PollaMax - Mundial',
  description: 'La polla mundialista familiar en tiempo real. Pronostica partidos, gana puntos y compite en el ranking familiar para ganar un gran premio.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-white selection:bg-emerald-500/30 selection:text-emerald-300">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full relative z-10">
            <AnimatedLayout>
              {children}
            </AnimatedLayout>
          </main>
          <footer className="py-6 px-4 border-t border-zinc-900 bg-black text-center text-xs text-zinc-500">
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-3" aria-label="Footer">
              <Link href="/" className="hover:text-emerald-400 transition-colors">Inicio</Link>
              <Link href="/terminos" className="hover:text-emerald-400 transition-colors">Términos y Condiciones</Link>
              <Link href="/cookies" className="hover:text-emerald-400 transition-colors">Política de Cookies</Link>
              <Link href="/dmca" className="hover:text-emerald-400 transition-colors">DMCA y Terceros</Link>
            </nav>
            <p>&copy; {new Date().getFullYear()} PollaMax. Hecho con ❤️ para la familia Cocunubo-Neuta mundialista.</p>
          </footer>
          <NotificationService />
          <NotificationBanner />
          <WelcomeScreen />
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}