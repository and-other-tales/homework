import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'othertales homework - datasets and knowledge graph tools for LLM Training',
  description: 'Generate datasets from GitHub repositories and websites',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster position="top-right" richColors />
        <main className="min-h-screen bg-background">
          {children}
        </main>
        <SetupWizardWrapper />
      </body>
    </html>
  )
}

// Client component wrapper
'use client';
import { useState, useEffect } from 'react';
import { SetupWizard } from '@/components/setup-wizard';

function SetupWizardWrapper() {
  const [mounted, setMounted] = useState(false);
  
  // Mark as mounted after component is rendered
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <SetupWizard />;
}