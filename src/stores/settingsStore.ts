import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Store, User, Supplier, UserRole, ProductCategory } from '@/types';
import { stores as initialStores } from '@/data/stores';
import { users as initialUsers } from '@/data/users';
import { suppliers as initialSuppliers } from '@/data/suppliers';
import { generateId } from '@/lib/utils';

interface SettingsState {
  stores: Store[];
  users: User[];
  suppliers: Supplier[];

  // Store actions
  updateStore: (id: string, data: Partial<Omit<Store, 'id' | 'createdAt'>>) => void;
  addStore: (data: Omit<Store, 'id' | 'createdAt'>) => Store;

  // User actions
  addUser: (data: Omit<User, 'id'>) => User;
  updateUser: (id: string, data: Partial<Omit<User, 'id'>>) => void;
  removeUser: (id: string) => void;

  // Supplier actions
  addSupplier: (data: Omit<Supplier, 'id'>) => Supplier;
  updateSupplier: (id: string, data: Partial<Omit<Supplier, 'id'>>) => void;
  removeSupplier: (id: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      stores:    initialStores,
      users:     initialUsers,
      suppliers: initialSuppliers,

      updateStore: (id, data) =>
        set(s => ({
          stores: s.stores.map(st =>
            st.id === id ? { ...st, ...data } : st
          ),
        })),

      addStore: (data) => {
        const newStore: Store = {
          ...data,
          id: generateId('store'),
          createdAt: new Date().toISOString(),
        };
        set(s => ({ stores: [...s.stores, newStore] }));
        return newStore;
      },

      addUser: (data) => {
        const newUser: User = { ...data, id: generateId('user') };
        set(s => ({ users: [...s.users, newUser] }));
        return newUser;
      },

      updateUser: (id, data) =>
        set(s => ({
          users: s.users.map(u => u.id === id ? { ...u, ...data } : u),
        })),

      removeUser: (id) =>
        set(s => ({ users: s.users.filter(u => u.id !== id) })),

      addSupplier: (data) => {
        const newSup: Supplier = { ...data, id: generateId('sup') };
        set(s => ({ suppliers: [...s.suppliers, newSup] }));
        return newSup;
      },

      updateSupplier: (id, data) =>
        set(s => ({
          suppliers: s.suppliers.map(su => su.id === id ? { ...su, ...data } : su),
        })),

      removeSupplier: (id) =>
        set(s => ({ suppliers: s.suppliers.filter(su => su.id !== id) })),
    }),
    { name: 'freshflow-settings' }
  )
);
