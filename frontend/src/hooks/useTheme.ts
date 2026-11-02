import { useState, useEffect } from 'react';

export function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('govresolve_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'light';
  });

  const [isHighContrast, setIsHighContrast] = useState<boolean>(() => {
    return localStorage.getItem('govresolve_contrast') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('govresolve_theme', theme);
    if (!isHighContrast) {
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
    }
  }, [theme, isHighContrast]);

  useEffect(() => {
    localStorage.setItem('govresolve_contrast', String(isHighContrast));
    if (isHighContrast) {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.documentElement.classList.add('high-contrast');
      document.body.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
      document.body.classList.remove('high-contrast');
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      }
    }
  }, [isHighContrast, theme]);

  useEffect(() => {
    document.documentElement.style.colorScheme = isHighContrast || theme === 'dark' ? 'dark' : 'light';
  }, [isHighContrast, theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const toggleHighContrast = () => {
    setIsHighContrast(prev => !prev);
  };

  return {
    theme,
    isHighContrast,
    toggleTheme,
    toggleHighContrast
  };
}
