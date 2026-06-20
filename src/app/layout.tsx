import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/AuthProvider';
import { Navbar } from '@/components/Navbar';

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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-zinc-950 text-white selection:bg-emerald-500/30 selection:text-emerald-300">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 w-full relative z-10">
            {children}
          </main>
          <footer className="py-6 border-t border-zinc-900 bg-black text-center text-xs text-zinc-500">
            &copy; {new Date().getFullYear()} PollaMax. Hecho con ❤️ para la familia Cocunubo-Neuta mundialista.
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
