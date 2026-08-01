import { create } from 'zustand';

interface UIState {
  sidebarOpen: boolean;
  activeSection: string;
  notificationPanelOpen: boolean;

  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setActiveSection: (section: string) => void;
  setNotificationPanelOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  activeSection: 'overview',
  notificationPanelOpen: false,

  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setActiveSection: (section) => set({ activeSection: section }),
  setNotificationPanelOpen: (open) => set({ notificationPanelOpen: open }),
}));
