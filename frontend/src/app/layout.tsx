'use client';

import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { useState, useEffect } from 'react';
import { SetupWizard } from '@/components/setup-wizard';

const inter = Inter({ subsets: ['latin'] })

// Metadata can't be used in client components, so we define it outside
export const metadata = {
  title: 'othertales homework - datasets and knowledge graph tools for LLM Training',
  description: 'Generate datasets from GitHub repositories and websites',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [mounted, setMounted] = useState(false);
  
  // Mark as mounted after component is rendered
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster position="top-right" richColors />
        <main className="min-h-screen bg-background">
          {children}
        </main>
        {mounted && <SetupWizard />}
      </body>
    </html>
  )
}