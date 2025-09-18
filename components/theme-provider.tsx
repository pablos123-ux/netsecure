'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider, useTheme as useNextTheme } from 'next-themes';
import { type ThemeProviderProps } from 'next-themes/dist/types';

// Create a custom hook to access theme
export function useTheme() {
  const { theme, setTheme, systemTheme } = useNextTheme();
  
  return {
    theme,
    setTheme,
    isDark: theme === 'dark' || (theme === 'system' && systemTheme === 'dark'),
    systemTheme,
  };
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Force dark theme on the HTML element
  React.useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isDark = root.classList.contains('dark');
          document.body.classList.toggle('dark', isDark);
          document.body.style.colorScheme = isDark ? 'dark' : 'light';
        }
      });
    });

    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class']
    });

    // Initial check
    const isDark = root.classList.contains('dark');
    document.body.classList.toggle('dark', isDark);
    document.body.style.colorScheme = isDark ? 'dark' : 'light';

    return () => observer.disconnect();
  }, [mounted]);

  if (!mounted) {
    // Render nothing on server and during hydration to avoid mismatch
    return null;
  }

  return (
    <NextThemesProvider 
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemesProvider>
  );
}
