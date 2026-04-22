import type { Metadata } from 'next';
import { Bricolage_Grotesque, Inter_Tight } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import AuthToast from '@/components/AuthToast';
import './globals.css';

const bricolage = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-bricolage',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'Al Diente — Cuidado dental supervisado',
  description: 'Agenda con estudiantes de odontología certificados. Supervisión docente y precios justos.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${bricolage.variable} ${interTight.variable}`}>
      <body>
        <AuthProvider>
          <AuthToast />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
