'use client';

import { useState, useEffect } from 'react';
import { SetupWizard } from '@/components/setup-wizard';

export function SetupWizardWrapper() {
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