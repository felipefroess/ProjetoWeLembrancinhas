'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { StoreSettings, DEFAULT_SETTINGS } from '@/types/storeSettings';

interface StoreSettingsContextType {
  settings: StoreSettings;
  loading: boolean;
  refreshSettings: () => Promise<void>;
  updateSettings: (
    updates: Partial<StoreSettings>,
    applyLeadTimeToAllProducts?: boolean
  ) => Promise<{ success: boolean; message?: string; error?: string }>;
}

const StoreSettingsContext = createContext<StoreSettingsContextType | undefined>(undefined);

const CACHE_KEY = 'we_cached_store_settings';

export function StoreSettingsProvider({ 
  children,
  initialSettings,
}: { 
  children: React.ReactNode;
  initialSettings?: StoreSettings;
}) {
  const [settings, setSettings] = useState<StoreSettings>(initialSettings || DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(!initialSettings);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/store-settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data.settings));
        } catch {}
      }
    } catch (err) {
      console.error('Falha ao carregar configurações da loja:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Hidratação rápida via localStorage se disponível
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          setSettings((prev) => ({ ...prev, ...parsed }));
        }
      }
    } catch {}

    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = async (
    updates: Partial<StoreSettings>,
    applyLeadTimeToAllProducts = false
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    try {
      const res = await fetch('/api/store-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          applyLeadTimeToAllProducts,
        }),
      });
      const data = await res.json();

      if (data.success && data.settings) {
        setSettings(data.settings);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(data.settings));
        } catch {}
        return { success: true, message: data.message || 'Configurações salvas com sucesso!' };
      } else {
        return { success: false, error: data.error || 'Erro ao salvar configurações.' };
      }
    } catch {
      return { success: false, error: 'Erro de comunicação com o servidor.' };
    }
  };

  return (
    <StoreSettingsContext.Provider
      value={{
        settings,
        loading,
        refreshSettings: fetchSettings,
        updateSettings,
      }}
    >
      {children}
    </StoreSettingsContext.Provider>
  );
}

export function useStoreSettings() {
  const context = useContext(StoreSettingsContext);
  if (!context) {
    return {
      settings: DEFAULT_SETTINGS,
      loading: false,
      refreshSettings: async () => {},
      updateSettings: async () => ({ success: false, error: 'Provider não configurado.' }),
    };
  }
  return context;
}
