import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { useAppStore } from '@/stores/appStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useLanguageStore } from '@/stores/languageStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Store, Users, Truck, Bell, Globe, Info, Leaf, CheckCircle2, Pencil, Trash2, Plus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Language } from '@/i18n';
import type { UserRole, ProductCategory } from '@/types';
import { SupplierScorecard } from './SupplierScorecard';

const CATEGORIES: ProductCategory[] = ['Dairy','Meat & Poultry','Bakery','Produce','Seafood','Deli','Frozen','Beverages','Snacks','Condiments','Canned Goods','Health & Beauty'];
const ROLES: UserRole[] = ['manager', 'staff', 'admin'];

export function SettingsPage() {
  const { currentStoreId, setCurrentStore } = useAppStore();
  const { stores, users, suppliers, updateStore, addStore, addUser, updateUser, removeUser, addSupplier, updateSupplier, removeSupplier } = useSettingsStore();
  const { language, setLanguage } = useLanguageStore();
  const { t, isRTL } = useTranslation();
  const s = t.settings;

  const [activeTab, setActiveTab] = useState('store');
  const [saved, setSaved] = useState(false);
  const [storeForm, setStoreForm] = useState<Record<string, string>>({});
  const [storeEditId, setStoreEditId] = useState<string | null>(null);

  // Auto-populate storeForm when currentStoreId changes or on mount
  const activeStoreId = storeEditId ?? currentStoreId;
  useEffect(() => {
    const st = stores.find(s => s.id === activeStoreId);
    if (st) {
      setStoreForm({ name: st.name, manager: st.manager, address: st.address, postcode: st.postcode, phone: st.phone });
    }
  }, [activeStoreId, stores]);

  // User dialog state
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<typeof users[0] | null>(null);
  const [userForm, setUserForm] = useState({ name: '', email: '', role: 'staff' as UserRole, storeId: currentStoreId });
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<string | null>(null);

  // Supplier dialog state
  const [supDialogOpen, setSupDialogOpen] = useState(false);
  const [editingSup, setEditingSup] = useState<typeof suppliers[0] | null>(null);
  const [supForm, setSupForm] = useState({ name: '', contactEmail: '', contactPhone: '', category: 'Dairy' as ProductCategory });
  const [confirmDeleteSup, setConfirmDeleteSup] = useState<string | null>(null);

  const currentStore = stores.find(st => st.id === (storeEditId ?? currentStoreId));

  function startEditStore(id: string) {
    const st = stores.find(s => s.id === id);
    if (!st) return;
    setStoreEditId(id);
    setStoreForm({ name: st.name, manager: st.manager, address: st.address, postcode: st.postcode, phone: st.phone });
  }

  function handleSaveStore() {
    const targetId = storeEditId ?? currentStoreId;
    if (targetId) {
      updateStore(targetId, {
        name: storeForm.name,
        manager: storeForm.manager,
        address: storeForm.address,
        postcode: storeForm.postcode,
        phone: storeForm.phone,
      });
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  // User helpers
  function openAddUser() {
    setEditingUser(null);
    setUserForm({ name: '', email: '', role: 'staff', storeId: currentStoreId });
    setUserDialogOpen(true);
  }
  function openEditUser(u: typeof users[0]) {
    setEditingUser(u);
    setUserForm({ name: u.name, email: u.email, role: u.role, storeId: u.storeId });
    setUserDialogOpen(true);
  }
  function handleSaveUser() {
    if (editingUser) updateUser(editingUser.id, userForm);
    else addUser(userForm);
    setUserDialogOpen(false);
  }

  // Supplier helpers
  function openAddSup() {
    setEditingSup(null);
    setSupForm({ name: '', contactEmail: '', contactPhone: '', category: 'Dairy' });
    setSupDialogOpen(true);
  }
  function openEditSup(su: typeof suppliers[0]) {
    setEditingSup(su);
    setSupForm({ name: su.name, contactEmail: su.contactEmail, contactPhone: su.contactPhone, category: su.category });
    setSupDialogOpen(true);
  }
  function handleSaveSup() {
    if (editingSup) updateSupplier(editingSup.id, supForm);
    else addSupplier(supForm);
    setSupDialogOpen(false);
  }

  const tabs = [
    { id: 'store',         label: s.store,         icon: <Store size={14} /> },
    { id: 'users',         label: s.team,           icon: <Users size={14} /> },
    { id: 'suppliers',     label: s.suppliers,      icon: <Truck size={14} /> },
    { id: 'notifications', label: s.notifications,  icon: <Bell size={14} /> },
    { id: 'language',      label: s.language,       icon: <Globe size={14} /> },
    { id: 'about',         label: s.about,          icon: <Info size={14} /> },
  ];

  return (
    <div className="space-y-4">
      <div className={cn(isRTL && 'text-right')}>
        <h1 className="text-xl font-semibold text-slate-900">{s.title}</h1>
        <p className="text-sm text-slate-500 mt-0.5">{s.subtitle}</p>
      </div>

      <div className={cn('flex gap-5', isRTL && 'flex-row-reverse')}>
        {/* Tab nav */}
        <div className="w-44 flex-shrink-0">
          <div className="settings-nav-glow hidden md:block">
            <nav className="settings-nav-inner space-y-0.5 p-1">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                    isRTL ? 'flex-row-reverse text-right' : 'text-left',
                    activeTab === tab.id ? 'bg-green-50 text-green-800 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}>
                  <span className={activeTab === tab.id ? 'text-green-700' : 'text-slate-400'}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
          {/* Mobile nav without glow */}
          <nav className="md:hidden space-y-0.5">
            {tabs.map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                  isRTL ? 'flex-row-reverse text-right' : 'text-left',
                  activeTab === tab.id ? 'bg-green-50 text-green-800 font-medium' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}>
                <span className={activeTab === tab.id ? 'text-green-700' : 'text-slate-400'}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-4">
          {activeTab === 'store'         && <StoreTab stores={stores} currentStoreId={currentStoreId} setCurrentStore={(id) => { setCurrentStore(id); setStoreEditId(id); }} storeForm={storeForm} setStoreForm={setStoreForm} handleSaveStore={handleSaveStore} saved={saved} s={s} t={t} isRTL={isRTL} />}
          {activeTab === 'users'         && <UsersTab users={users} openAddUser={openAddUser} openEditUser={openEditUser} confirmDeleteUser={confirmDeleteUser} setConfirmDeleteUser={setConfirmDeleteUser} removeUser={removeUser} s={s} t={t} isRTL={isRTL} />}
          {activeTab === 'suppliers'     && <SupplierScorecard openAddSup={openAddSup} openEditSup={openEditSup} t={t} isRTL={isRTL} />}
          {activeTab === 'notifications' && <NotificationsTab s={s} t={t} isRTL={isRTL} saved={saved} setSaved={setSaved} />}
          {activeTab === 'language'      && <LanguageTab language={language} setLanguage={setLanguage} s={s} isRTL={isRTL} />}
          {activeTab === 'about'         && <AboutTab s={s} t={t} isRTL={isRTL} />}
        </div>
      </div>

      {/* User Dialog */}
      <Dialog open={userDialogOpen} onClose={() => setUserDialogOpen(false)}
        title={editingUser ? (isRTL ? 'ویرایش عضو تیم' : 'Edit Team Member') : (isRTL ? 'افزودن عضو تیم' : 'Invite Team Member')} size="md">
        <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
          <Input label={isRTL ? 'نام کامل' : 'Full Name'} value={userForm.name} onChange={e => setUserForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. John Smith" />
          <Input label={isRTL ? 'ایمیل' : 'Email'} type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} placeholder="name@store.co.uk" />
          <Select label={isRTL ? 'نقش' : 'Role'} value={userForm.role} onChange={e => setUserForm(f => ({ ...f, role: e.target.value as UserRole }))}>
            {ROLES.map(r => <option key={r} value={r}>{t.roles[r]}</option>)}
          </Select>
          <div className={cn('flex gap-2 pt-2', isRTL ? 'flex-row-reverse' : '')}>
            <Button onClick={handleSaveUser} disabled={!userForm.name || !userForm.email}>{t.common.save}</Button>
            <Button variant="secondary" onClick={() => setUserDialogOpen(false)}>{t.common.cancel}</Button>
          </div>
        </div>
      </Dialog>

      {/* Supplier Dialog */}
      <Dialog open={supDialogOpen} onClose={() => setSupDialogOpen(false)}
        title={editingSup ? (isRTL ? 'ویرایش تأمین‌کننده' : 'Edit Supplier') : (isRTL ? 'افزودن تأمین‌کننده' : 'Add Supplier')} size="md">
        <div className="space-y-3" dir={isRTL ? 'rtl' : 'ltr'}>
          <Input label={isRTL ? 'نام شرکت' : 'Company Name'} value={supForm.name} onChange={e => setSupForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Meadow Fresh Dairy" />
          <Input label={isRTL ? 'ایمیل تماس' : 'Contact Email'} type="email" value={supForm.contactEmail} onChange={e => setSupForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="orders@supplier.co.uk" />
          <Input label={isRTL ? 'تلفن' : 'Phone'} value={supForm.contactPhone} onChange={e => setSupForm(f => ({ ...f, contactPhone: e.target.value }))} placeholder="01234 567890" />
          <Select label={isRTL ? 'دسته‌بندی' : 'Category'} value={supForm.category} onChange={e => setSupForm(f => ({ ...f, category: e.target.value as ProductCategory }))}>
            {CATEGORIES.map(c => <option key={c} value={c}>{t.categories[c as keyof typeof t.categories] ?? c}</option>)}
          </Select>
          <div className={cn('flex gap-2 pt-2', isRTL ? 'flex-row-reverse' : '')}>
            <Button onClick={handleSaveSup} disabled={!supForm.name || !supForm.contactEmail}>{t.common.save}</Button>
            <Button variant="secondary" onClick={() => setSupDialogOpen(false)}>{t.common.cancel}</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// ─── Store Tab ───────────────────────────────────────────────────────────────
function StoreTab({ stores, currentStoreId, setCurrentStore, storeForm, setStoreForm, handleSaveStore, saved, s, t, isRTL }: {
  stores: import('@/types').Store[];
  currentStoreId: string;
  setCurrentStore: (id: string) => void;
  storeForm: Record<string, string>;
  setStoreForm: (fn: (f: Record<string, string>) => Record<string, string>) => void;
  handleSaveStore: () => void;
  saved: boolean;
  s: typeof import('@/i18n').en.settings;
  t: typeof import('@/i18n').en;
  isRTL: boolean;
}) {
  const fields = [
    { key: 'name',     label: s.storeName },
    { key: 'manager',  label: s.manager },
    { key: 'address',  label: s.address },
    { key: 'postcode', label: s.postcode },
    { key: 'phone',    label: s.phone },
  ] as const;

  return (
    <Card padding="lg">
      <h2 className={cn('text-base font-semibold text-slate-900 mb-4', isRTL && 'text-right')}>{s.storeTitle}</h2>
      <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Store selector */}
        <Select label={s.activeStore} value={currentStoreId} onChange={e => setCurrentStore(e.target.value)}>
          {stores.map(st => <option key={st.id} value={st.id}>{st.name}</option>)}
        </Select>

        <div className="h-px bg-slate-100" />

        {/* Editable fields */}
        <div className="grid grid-cols-2 gap-4">
          {fields.map(field => (
            <Input
              key={field.key}
              label={field.label}
              value={storeForm[field.key] ?? ''}
              onChange={e => setStoreForm(f => ({ ...f, [field.key]: e.target.value }))}
              placeholder={field.label}
            />
          ))}
        </div>

        <div className={cn('flex items-center gap-2 pt-2 border-t border-slate-100', isRTL && 'flex-row-reverse')}>
          <Button onClick={handleSaveStore}>
            {saved ? `✓ ${t.common.save}` : t.common.saveChanges}
          </Button>
          {saved && <CheckCircle2 size={15} className="text-green-600" />}
          {saved && (
            <span className="text-xs text-green-600">
              {isRTL ? 'تغییرات ذخیره شد.' : 'Changes saved.'}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Users Tab ───────────────────────────────────────────────────────────────
function UsersTab({ users, openAddUser, openEditUser, confirmDeleteUser, setConfirmDeleteUser, removeUser, s, t, isRTL }: {
  users: import('@/types').User[];
  openAddUser: () => void;
  openEditUser: (u: import('@/types').User) => void;
  confirmDeleteUser: string | null;
  setConfirmDeleteUser: (id: string | null) => void;
  removeUser: (id: string) => void;
  s: typeof import('@/i18n').en.settings;
  t: typeof import('@/i18n').en;
  isRTL: boolean;
}) {
  return (
    <Card padding="lg">
      <div className={cn('flex items-center justify-between mb-4', isRTL && 'flex-row-reverse')}>
        <h2 className="text-base font-semibold text-slate-900">{s.teamTitle}</h2>
        <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
          <Badge variant="default">{users.length} {s.members}</Badge>
          <Button size="sm" leftIcon={<Plus size={13} />} onClick={openAddUser}>
            {isRTL ? 'افزودن عضو' : 'Add Member'}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {users.map(user => (
          <div key={user.id}
            className={cn('flex items-center gap-3 px-3 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors', isRTL && 'flex-row-reverse')}>
            {/* Avatar */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-green-400 to-green-700 flex items-center justify-center text-sm font-semibold text-white flex-shrink-0">
              {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            {/* Info */}
            <div className={cn('flex-1 min-w-0', isRTL && 'text-right')}>
              <p className="text-sm font-medium text-slate-900 truncate">{user.name}</p>
              <p className="text-xs text-slate-500 truncate">{user.email}</p>
            </div>
            {/* Role badge */}
            <Badge
              variant={user.role === 'manager' ? 'success' : user.role === 'admin' ? 'danger' : 'default'}
              size="sm">
              {t.roles[user.role as keyof typeof t.roles] ?? user.role}
            </Badge>
            {/* Actions */}
            <div className={cn('flex items-center gap-1 flex-shrink-0', isRTL && 'flex-row-reverse')}>
              <button onClick={() => openEditUser(user)}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title={t.common.edit}>
                <Pencil size={13} />
              </button>
              {confirmDeleteUser === user.id ? (
                <div className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse')}>
                  <button onClick={() => { removeUser(user.id); setConfirmDeleteUser(null); }}
                    className="px-2 py-1 text-[11px] font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
                    {t.common.confirm}
                  </button>
                  <button onClick={() => setConfirmDeleteUser(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDeleteUser(user.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title={t.common.delete}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}

        {users.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg">
            {isRTL ? 'هیچ عضوی در تیم وجود ندارد.' : 'No team members yet.'}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Suppliers Tab ───────────────────────────────────────────────────────────
function SuppliersTab({ suppliers, openAddSup, openEditSup, confirmDeleteSup, setConfirmDeleteSup, removeSupplier, s, t, isRTL }: {
  suppliers: import('@/types').Supplier[];
  openAddSup: () => void;
  openEditSup: (su: import('@/types').Supplier) => void;
  confirmDeleteSup: string | null;
  setConfirmDeleteSup: (id: string | null) => void;
  removeSupplier: (id: string) => void;
  s: typeof import('@/i18n').en.settings;
  t: typeof import('@/i18n').en;
  isRTL: boolean;
}) {
  return (
    <Card padding="lg">
      <div className={cn('flex items-center justify-between mb-4', isRTL && 'flex-row-reverse')}>
        <h2 className="text-base font-semibold text-slate-900">{s.suppliersTitle}</h2>
        <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
          <Badge variant="default">{suppliers.length}</Badge>
          <Button size="sm" leftIcon={<Plus size={13} />} onClick={openAddSup}>
            {t.common.addSupplier}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {suppliers.map(sup => (
          <div key={sup.id}
            className={cn('flex items-center gap-3 px-3 py-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors', isRTL && 'flex-row-reverse')}>
            {/* Icon */}
            <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
              <Truck size={15} className="text-slate-500" />
            </div>
            {/* Info */}
            <div className={cn('flex-1 min-w-0', isRTL && 'text-right')}>
              <p className="text-sm font-semibold text-slate-900 truncate">{sup.name}</p>
              <p className="text-xs text-slate-500 truncate">{sup.contactEmail}</p>
              <p className="text-xs text-slate-400">{sup.contactPhone}</p>
            </div>
            {/* Category */}
            <Badge variant="outline" size="sm" className="flex-shrink-0">
              {t.categories[sup.category as keyof typeof t.categories] ?? sup.category}
            </Badge>
            {/* Actions */}
            <div className={cn('flex items-center gap-1 flex-shrink-0', isRTL && 'flex-row-reverse')}>
              <button onClick={() => openEditSup(sup)}
                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                title={t.common.edit}>
                <Pencil size={13} />
              </button>
              {confirmDeleteSup === sup.id ? (
                <div className={cn('flex items-center gap-1', isRTL && 'flex-row-reverse')}>
                  <button onClick={() => { removeSupplier(sup.id); setConfirmDeleteSup(null); }}
                    className="px-2 py-1 text-[11px] font-medium bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors">
                    {t.common.confirm}
                  </button>
                  <button onClick={() => setConfirmDeleteSup(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-md">
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setConfirmDeleteSup(sup.id)}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                  title={t.common.delete}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          </div>
        ))}

        {suppliers.length === 0 && (
          <div className="text-center py-8 text-sm text-slate-400 border border-dashed border-slate-200 rounded-lg">
            {isRTL ? 'هیچ تأمین‌کننده‌ای ثبت نشده.' : 'No suppliers added yet.'}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Notifications Tab ───────────────────────────────────────────────────────
function NotificationsTab({ s, t, isRTL, saved, setSaved }: {
  s: typeof import('@/i18n').en.settings;
  t: typeof import('@/i18n').en;
  isRTL: boolean;
  saved: boolean;
  setSaved: (v: boolean) => void;
}) {
  const prefs = s.notifPrefs as unknown as Array<{ label: string; description: string }>;
  const [checks, setChecks] = useState(() => prefs.map((_, i) => i < 4));

  function toggle(i: number) {
    setChecks(c => c.map((v, idx) => idx === i ? !v : v));
  }

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <Card padding="lg">
      <h2 className={cn('text-base font-semibold text-slate-900 mb-4', isRTL && 'text-right')}>
        {s.notificationsTitle}
      </h2>
      <div className="space-y-1">
        {prefs.map((pref, i) => (
          <div key={pref.label}
            className={cn('flex items-start justify-between py-3 border-b border-slate-50 last:border-0', isRTL && 'flex-row-reverse')}>
            <div className={cn('flex-1 mr-4', isRTL && 'mr-0 ml-4 text-right')}>
              <p className="text-sm font-medium text-slate-900">{pref.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">{pref.description}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-0.5">
              <input type="checkbox" checked={checks[i] ?? false}
                onChange={() => toggle(i)} className="sr-only peer" />
              <div className="w-9 h-5 bg-slate-200 peer-checked:bg-green-600 rounded-full peer transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
            </label>
          </div>
        ))}
      </div>
      <div className={cn('flex items-center gap-2 pt-4 mt-2 border-t border-slate-100', isRTL && 'flex-row-reverse')}>
        <Button onClick={handleSave}>
          {saved ? `✓ ${t.common.save}` : t.common.save}
        </Button>
        {saved && <CheckCircle2 size={15} className="text-green-600" />}
      </div>
    </Card>
  );
}

// ─── Language Tab ─────────────────────────────────────────────────────────────
function LanguageTab({ language, setLanguage, s, isRTL }: {
  language: Language;
  setLanguage: (l: Language) => void;
  s: typeof import('@/i18n').en.settings;
  isRTL: boolean;
}) {
  return (
    <Card padding="lg">
      <h2 className={cn('text-base font-semibold text-slate-900 mb-1', isRTL && 'text-right')}>
        {s.languageTitle}
      </h2>
      <p className={cn('text-sm text-slate-500 mb-6', isRTL && 'text-right')}>
        {s.languageSubtitle}
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button onClick={() => setLanguage('en')}
          className={cn('flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all text-left',
            language === 'en' ? 'border-green-600 bg-green-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50')}>
          <span className="text-3xl">🇬🇧</span>
          <div className="flex-1">
            <p className={cn('text-sm font-semibold', language === 'en' ? 'text-green-800' : 'text-slate-900')}>English</p>
            <p className="text-xs text-slate-500 mt-0.5">Left to right · £ GBP</p>
          </div>
          {language === 'en' && <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />}
        </button>

        <button onClick={() => setLanguage('fa')}
          className={cn('flex items-center gap-4 px-5 py-4 rounded-xl border-2 transition-all',
            isRTL ? 'flex-row-reverse text-right' : 'text-left',
            language === 'fa' ? 'border-green-600 bg-green-50' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50')}>
          <span className="text-3xl">🇮🇷</span>
          <div className="flex-1">
            <p className={cn('font-semibold text-sm', language === 'fa' ? 'text-green-800' : 'text-slate-900')}
              style={{ fontFamily: "'Vazirmatn', sans-serif" }}>فارسی</p>
            <p className="text-xs text-slate-500 mt-0.5" style={{ fontFamily: "'Vazirmatn', sans-serif" }}>
              راست به چپ · تومان
            </p>
          </div>
          {language === 'fa' && <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />}
        </button>
      </div>
      <div className={cn('mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200', isRTL && 'text-right')}>
        <p className="text-xs text-slate-600">
          {language === 'fa'
            ? '✓ زبان فارسی با قلم وزیرمتن فعال است. رابط کاربری به‌صورت راست‌چین نمایش داده می‌شود.'
            : '✓ English is active. Interface displays left to right with GBP currency.'}
        </p>
      </div>
    </Card>
  );
}

// ─── About Tab ────────────────────────────────────────────────────────────────
function AboutTab({ s, t, isRTL }: {
  s: typeof import('@/i18n').en.settings;
  t: typeof import('@/i18n').en;
  isRTL: boolean;
}) {
  return (
    <div className="space-y-4">
      <Card padding="lg">
        <div className={cn('flex items-center gap-3 mb-4', isRTL && 'flex-row-reverse')}>
          <div className="w-10 h-10 rounded-xl bg-green-700 flex items-center justify-center flex-shrink-0">
            <Leaf size={20} className="text-white" />
          </div>
          <div className={cn(isRTL && 'text-right')}>
            <h2 className="text-base font-bold text-slate-900">FreshFlow</h2>
            <p className="text-xs text-slate-500">
              {isRTL
                ? 'سامانه هوشمند مدیریت عملیات فروشگاه‌های زنجیره‌ای'
                : 'Smart operations and automation for modern grocery stores'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: s.version,     value: '1.0.0' },
            { label: s.build,       value: '2026.07.26' },
            { label: s.environment, value: isRTL ? 'محصول' : 'Production' },
            { label: s.dataLayer,   value: isRTL ? 'محلی (آزمایشی)' : 'Local (Mock)' },
          ].map(item => (
            <div key={item.label} className={cn('bg-slate-50 rounded-md p-2.5', isRTL && 'text-right')}>
              <p className="text-[11px] text-slate-400">{item.label}</p>
              <p className="text-sm font-medium text-slate-800 mt-0.5">{item.value}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card padding="lg">
        <h3 className={cn('text-sm font-semibold text-slate-900 mb-3', isRTL && 'text-right')}>
          {s.coreFeatures}
        </h3>
        <div className="space-y-2">
          {(s.features as unknown as string[]).map(feature => (
            <div key={feature}
              className={cn('flex items-center gap-2 text-xs text-slate-600', isRTL && 'flex-row-reverse')}>
              <CheckCircle2 size={12} className="text-green-600 flex-shrink-0" />
              {feature}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
