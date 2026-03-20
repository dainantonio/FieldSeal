import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Notary Law Analyst | Grounded Extraction',
  description: 'Professional tool for legal regulatory analysis of notarial statutes.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning className="bg-[#E4E3E0] text-[#141414] font-sans">{children}</body>
    </html>
  );
}
