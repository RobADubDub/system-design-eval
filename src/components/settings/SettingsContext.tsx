'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DEFAULT_MODEL } from '@/lib/ai/models';

const STORAGE_KEY = 'system-design-eval-settings';

interface Settings {
  selectedModel: string;
}

interface SettingsContextValue {
  settings: Settings;
  setSelectedModel: (modelId: string) => void;
}

const defaultSettings: Settings = {
  selectedModel: DEFAULT_MODEL,
};

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({
          ...defaultSettings,
          ...parsed,
        });
      }
    } catch (error) {
      console.warn('Failed to load settings from localStorage:', error);
    }
    setIsHydrated(true);
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    if (isHydrated) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
      } catch (error) {
        console.warn('Failed to save settings to localStorage:', error);
      }
    }
  }, [settings, isHydrated]);

  const setSelectedModel = useCallback((modelId: string) => {
    setSettings(prev => ({
      ...prev,
      selectedModel: modelId,
    }));
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, setSelectedModel }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
