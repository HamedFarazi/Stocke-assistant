import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Bell, CheckCheck, AlertTriangle, Package, GitBranch, ClipboardList, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import type { NotificationType } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';

interface NotificationPanelProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (section: string) => void;
}

function getNotifIcon(type: NotificationType) {
  switch (type) {
    case 'critical-expiry':    return <AlertTriangle size={14} className="text-red-500" />;
    case 'low-stock':          return <Package size={14} className="text-orange-500" />;
    case 'workflow-failure':
    case 'workflow-executed':  return <GitBranch size={14} className="text-blue-500" />;
    case 'operation-assigned':
    case 'operation-overdue':  return <ClipboardList size={14} className="text-amber-500" />;
    case 'product-expired':    return <AlertTriangle size={14} className="text-red-600" />;
    default:                   return <Bell size={14} className="text-slate-400" />;
  }
}

function getNavTarget(entityType: string | null): string {
  switch (entityType) {
    case 'product':   return 'inventory';
    case 'operation': return 'operations';
    case 'workflow':  return 'workflows';
    default:          return 'overview';
  }
}

function toPersianDigits(n: string | number): string {
  return String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[parseInt(d)]);
}

function localiseTimeAgo(dateStr: string, isFa: boolean): string {
  const date = new Date(dateStr);
  if (!isFa) {
    return formatDistanceToNow(date, { addSuffix: true });
  }

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 1) return 'چند لحظه پیش';
  if (diffMin < 60) return `${toPersianDigits(diffMin)} دقیقه پیش`;
  if (diffHour === 1) return 'حدود ۱ ساعت پیش';
  if (diffHour < 24) return `حدود ${toPersianDigits(diffHour)} ساعت پیش`;
  if (diffDay === 1) return 'دیروز';
  return `${toPersianDigits(diffDay)} روز پیش`;
}

function localiseNotifText(text: string, isFa: boolean): string {
  if (!isFa || !text) return text;
  return text
    // Titles
    .replace(/Croissants expire today/gi, 'کرواسان امروز منقضی می‌شود')
    .replace(/Beef Mince expires tomorrow/gi, 'گوشت چرخ‌کرده فردا منقضی می‌شود')
    .replace(/Expiry Protection workflow triggered/gi, 'گردش‌کار محافظت از انقضا فعال شد')
    .replace(/New operation assigned to you/gi, 'عملیات جدید به شما تخصیص یافت')
    .replace(/Smart operation created/gi, 'عملیات هوشمند ایجاد شد')

    // Products
    .replace(/Free Range Eggs/gi, 'تخم‌مرغ محلی')
    .replace(/Orange Juice/gi, 'آب‌میوه پرتقال')
    .replace(/Mature Cheddar/gi, 'پنیر چدار')
    .replace(/Croissants/gi, 'نان کرواسان')
    .replace(/Beef Mince/gi, 'گوشت چرخ‌کرده')
    .replace(/Greek Yogurt/gi, 'ماست یونانی')
    .replace(/Whole Milk/gi, 'شیر کامل')

    // Descriptions & Messages
    .replace(/Discount review & auto-workflow/gi, 'بررسی تخفیف و گردش‌کار خودکار')
    .replace(/Product status stable/gi, 'وضعیت محصول پایدار است')
    .replace(/Batch CR-F101 \(4 units\) expires today\. Immediate action required\./gi, 'دسته CR-F101 (۴ عدد) امروز منقضی می‌شود. نیازمند اقدام فوری.')
    .replace(/Batch CR-D101 \(6 units\) expires today\. Immediate action required\./gi, 'دسته CR-D101 (۶ عدد) امروز منقضی می‌شود. نیازمند اقدام فوری.')
    .replace(/Batch BM-H101 \(6 units\) expires in 1 day\. Estimated value at risk: £25\.20\./gi, 'دسته BM-H101 (۶ عدد) تا ۱ روز دیگر منقضی می‌شود. ارزش در معرض خطر: ۹۵۰,۰۰۰ تومان.')
    .replace(/Batch BM-D101 \(6 units\) expires in 1 day\. Estimated value at risk: £25\.20\./gi, 'دسته BM-D101 (۶ عدد) تا ۱ روز دیگر منقضی می‌شود. ارزش در معرض خطر: ۹۵۰,۰۰۰ تومان.')
    .replace(/Workflow ran for Greek Yogurt batch GY-B101\. Operation created and manager notified\./gi, 'گردش‌کار برای دسته ماست یونانی GY-B101 اجرا شد. عملیات ایجاد گردید و به مدیر اطلاع داده شد.')
    .replace(/Workflow ran for Greek Yogurt batch GY-D101\. Operation created and manager notified\./gi, 'گردش‌کار برای دسته ماست یونانی GY-D101 اجرا شد. عملیات ایجاد گردید و به مدیر اطلاع داده شد.')
    .replace(/Review Greek Yogurt for discount — due tomorrow\./gi, 'بررسی تخفیف ماست یونانی — مهلت تا فردا.')
    .replace(/units/gi, 'عدد')
    .replace(/expires today/gi, 'امروز منقضی می‌شود')
    .replace(/expires tomorrow/gi, 'فردا منقضی می‌شود');
}

export function NotificationPanel({ open, onClose, onNavigate }: NotificationPanelProps) {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useAppStore();
  const { t, isRTL } = useTranslation();
  const isFa = isRTL;
  const unread = notifications.filter(n => !n.isRead).length;

  return (
    <AnimatePresence>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute top-14 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden',
              isRTL ? 'left-0' : 'right-0'
            )}
          >
            <div className={cn(
              'flex items-center justify-between px-4 py-3 border-b border-slate-100',
              isRTL && 'flex-row-reverse'
            )}>
              <div className={cn('flex items-center gap-2', isRTL && 'flex-row-reverse')}>
                <h3 className="text-sm font-semibold text-slate-900">{t.notifications.title}</h3>
                {unread > 0 && (
                  <span className="text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5">{unread}</span>
                )}
              </div>
              {unread > 0 && (
                <button
                  onClick={markAllNotificationsRead}
                  className={cn('flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors', isRTL && 'flex-row-reverse')}
                >
                  <CheckCheck size={12} />
                  {t.notifications.markAllRead}
                </button>
              )}
            </div>

            <div className="overflow-y-auto max-h-[400px]">
              {notifications.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell size={24} className="text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">{t.notifications.noNotifications}</p>
                </div>
              ) : (
                notifications.slice(0, 15).map((notif) => (
                  <button
                    key={notif.id}
                    onClick={() => {
                      markNotificationRead(notif.id);
                      onNavigate(getNavTarget(notif.relatedEntityType));
                      onClose();
                    }}
                    className={cn(
                      'w-full px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3',
                      !notif.isRead && 'bg-blue-50/30',
                      isRTL && 'flex-row-reverse text-right'
                    )}
                  >
                    <div className={cn(
                      'mt-0.5 p-1.5 rounded-md flex-shrink-0',
                      !notif.isRead ? 'bg-white shadow-sm' : 'bg-slate-100'
                    )}>
                      {getNotifIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn('text-xs font-medium text-slate-900 truncate', !notif.isRead && 'font-semibold')}>
                        {isFa && notif.titleFa ? notif.titleFa : localiseNotifText(notif.title, isFa)}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {isFa && notif.messageFa ? notif.messageFa : localiseNotifText(notif.message, isFa)}
                      </p>
                      <div className={cn('flex items-center gap-1 mt-1 text-[10px] text-slate-400', isRTL && 'flex-row-reverse')}>
                        <Clock size={10} />
                        {localiseTimeAgo(notif.createdAt, isFa)}
                      </div>
                    </div>
                    {!notif.isRead && <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 flex-shrink-0" />}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
