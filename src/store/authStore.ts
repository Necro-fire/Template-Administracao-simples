import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

  changePassword: (pin: string, newPassword: string) => boolean;
  changePin: (password: string, newPin: string) => boolean;

  setCompanyName: (name: string) => void;
  setCnpj: (cnpj: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      cnpj: '00.000.000/0001-00',
      password: 'admin123',
      pin: '1234',
      pinUnlocked: false,
      companyName: 'Bella Pizza',

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

      changePassword: (pin, newPassword) => {
        if (pin === get().pin) {
          set({ password: newPassword });
          return true;
        }
        return false;
      },

      changePin: (password, newPin) => {
        if (password === get().password) {
          set({ pin: newPin });
          return true;
        }
        return false;
      },

      setCompanyName: (name) => set({ companyName: name }),
      setCnpj: (cnpj) => set({ cnpj }),
    }),
    { name: 'bella-pizza-auth' }
  )
);
