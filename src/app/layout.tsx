import type { Metadata } from 'next';
import { inter, merriweather } from '@/config/fonts';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import Link from 'next/link';
import { ScrollText } from 'lucide-react';

export const metadata: Metadata = {
  title: "Adventurer's Armory",
  description: 'Create, manage, and edit Dungeons & Dragons 3.5 edition character sheets.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${merriweather.variable} font-sans antialiased`}>
        <div className="min-h-screen flex flex-col">
          <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 max-w-screen-2xl items-center justify-between">
              <Link href="/" className="flex items-center space-x-2">
                <ScrollText className="h-8 w-8 text-primary" />
                <span className="font-serif text-xl font-bold tracking-tight text-primary">Adventurer's Armory</span>
              </Link>
              {/* Add navigation items here if needed */}
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="py-6 md:px-8 md:py-0 bg-background border-t border-border/40">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-20 md:flex-row">
              <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
                Built with passion for D&D 3.5.
              </p>
            </div>
          </footer>
        </div>
        <Toaster />
      </body>
    </html>
  );
}
