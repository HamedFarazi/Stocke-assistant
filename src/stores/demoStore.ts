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
      enterDemo: () => set({ isDemoMode: true }),
      exitDemo:  () => set({ isDemoMode: false }),
    }),
    { name: 'freshflow-demo' }
  )
);
