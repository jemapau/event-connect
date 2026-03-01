import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  title: 'EventConnect — Networking en Tiempo Real',
  description:
    'Plataforma de networking interactivo para eventos. Quiz en vivo, matchmaking por intereses y conexiones en tiempo real.',
};

// Inline script to apply saved theme before first paint (avoids flash)
const themeScript = `
(function() {
  try {
    var t = localStorage.getItem('ec-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', t);
  } catch(e) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        {/* Apply theme before first paint to avoid flash */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.className} ${spaceGrotesk.variable}`} suppressHydrationWarning>{children}</body>
    </html>
  );
}
