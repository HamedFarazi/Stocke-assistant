import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DemoState {
  isDemoMode: boolean;
  enterDemo: () => void;
  exitDemo: () => void;
}

export const useDemoStore = create<DemoState>()(
  persist(
    (set) => ({
      isDemoMode: false,

      enterDemo: () => {
        set({ isDemoMode: true });
        // Clear freshflow-store cache so demo data takes over
        try {
          const raw = localStorage.getItem('freshflow-store');
          if (raw) localStorage.removeItem('freshflow-store');
        } catch { /* ignore */ }
      },

      exitDemo: () => {
        set({ isDemoMode: false });
        // Clear demo data from localStorage so original data loads
        try {
          localStorage.removeItem('freshflow-store');
          localStorage.removeItem('freshflow-demo');
        } catch { /* ignore */ }
      },
    }),
    { name: 'freshflow-demo' }
  )
);
