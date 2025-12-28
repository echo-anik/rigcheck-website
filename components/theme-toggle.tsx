'use client';

import { useTheme } from 'next-themes';
import dynamic from 'next/dynamic';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ThemeToggleButton() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="relative w-10 h-10 rounded-md"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  );
}

export const ThemeToggle = dynamic(() => Promise.resolve(ThemeToggleButton), {
  ssr: false,
  loading: () => (
    <Button variant="ghost" size="icon" className="w-10 h-10" disabled aria-label="Loading">
      <Sun className="h-5 w-5" />
    </Button>
  ),
});
