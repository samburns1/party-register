import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Party Register',
  description: 'Register for the party via SMS',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}