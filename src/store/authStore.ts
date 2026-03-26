import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';

interface AuthState {
  isAuthenticated: boolean;
  cnpj: string;
  password: string;
  pin: string;
  pinUnlocked: boolean;
  companyName: string;

  login: (cnpj: string, password: string) => boolean;
  logout: () => void;
  unlockPin: (pin: string) => boolean;
  lockPin: () => void;

  recoverPasswordWithPin: (pin: string) => string | null;
  recoverPinWithCredentials: (cnpj: string, password: string) => string | null;

  changePassword: (currentPassword: string, newPassword: string) => boolean;
  changePin: (currentPin: string, newPin: string) => boolean;

  setCompanyName: (name: string) => void;
  setCnpj: (cnpj: string) => void;

  loadFromDb: () => Promise<void>;
}

async function saveToDb(key: string, value: string) {
  try {
    await supabase.from('app_settings').upsert({ key, value }, { onConflict: 'key' });
  } catch (_) { /* silent */ }
}

function parseDbValue(raw: unknown): string {
  if (typeof raw === 'string') {
    // Handle double-encoded JSON strings like "\"value\""
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'string') return parsed;
    } catch (_) { /* not JSON, use as-is */ }
    return raw;
  }
  return String(raw);
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      cnpj: '',
      password: '',
      pin: '',
      pinUnlocked: false,
      companyName: 'Bella Pizza',

      loadFromDb: async () => {
        try {
          const { data } = await supabase
            .from('app_settings')
            .select('key, value')
            .in('key', ['auth_password', 'auth_pin', 'auth_cnpj', 'company_name']);
          if (data) {
            const map: Record<string, string> = {};
            data.forEach(r => { map[r.key] = parseDbValue(r.value); });
            const updates: Partial<AuthState> = {};
            if (map.auth_password) updates.password = map.auth_password;
            if (map.auth_pin) updates.pin = map.auth_pin;
            if (map.auth_cnpj) updates.cnpj = map.auth_cnpj;
            if (map.company_name) updates.companyName = map.company_name;
            set(updates);
          }
        } catch (_) { /* silent */ }
      },

      login: (cnpj, password) => {
        const state = get();
        const cleanInput = cnpj.replace(/\D/g, '');
        const cleanStored = state.cnpj.replace(/\D/g, '');
        if (cleanInput === cleanStored && password === state.password) {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => set({ isAuthenticated: false, pinUnlocked: false }),

      unlockPin: (pin) => {
        if (pin === get().pin) {
          set({ pinUnlocked: true });
          return true;
        }
        return false;
      },

      lockPin: () => set({ pinUnlocked: false }),

      recoverPasswordWithPin: (pin) => {
        if (pin === get().pin) return get().password;
        return null;
      },

      recoverPinWithCredentials: (cnpj, password) => {
        const state = get();
        const cleanInput = cnpj.replace(/\D/g, '');
        const cleanStored = state.cnpj.replace(/\D/g, '');
        if (cleanInput === cleanStored && password === state.password) return state.pin;
        return null;
      },

      changePassword: (currentPassword, newPassword) => {
        if (currentPassword === get().password) {
          set({ password: newPassword });
          saveToDb('auth_password', newPassword);
          return true;
        }
        return false;
      },

      changePin: (currentPin, newPin) => {
        if (currentPin === get().pin) {
          set({ pin: newPin });
          saveToDb('auth_pin', newPin);
          return true;
        }
        return false;
      },

      setCompanyName: (name) => {
        set({ companyName: name });
        saveToDb('company_name', name);
      },

      setCnpj: (cnpj) => {
        set({ cnpj });
        saveToDb('auth_cnpj', cnpj);
      },
    }),
    { name: 'bella-pizza-auth' }
  )
);
