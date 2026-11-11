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

export function StoreSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/store-settings');
      const data = await res.json();
      if (data.success && data.settings) {
        setSettings(data.settings);
      }
    } catch (err) {
      console.error('Falha ao carregar configurações da loja:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
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
