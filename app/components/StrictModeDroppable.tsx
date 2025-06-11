/**
 * Wrapper component to prevent double rendering in React StrictMode
 * This helps avoid duplicate API calls during development
 */

import { useEffect, useState } from 'react';

interface StrictModeDroppableProps {
  children: React.ReactNode;
}

export function StrictModeDroppable({ children }: StrictModeDroppableProps) {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  if (!enabled) {
    return null;
  }

  return <>{children}</>;
}
