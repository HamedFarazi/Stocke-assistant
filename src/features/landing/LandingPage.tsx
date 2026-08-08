import { useState } from "react";
import { motion } from "framer-motion";
import { useDemoStore } from "@/stores/demoStore";
import { useAppStore } from "@/stores/appStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useLanguageStore } from "@/stores/languageStore";
import {
  demoBatches,
  demoOperations,
  demoNotifications,
  demoActivities,
  DEMO_STORE,
} from "@/data/demoData";
import {
  Leaf,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Play,
  ChevronRight,
  Globe,
  Package,
  AlertTriangle,
  GitBranch,
  ClipboardList,
  BarChart3,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LandingPageProps {
  onEnterApp: () => void;
}

const LOAD_STEPS_EN = [
  "Connecting to test Market…",
  "Loading 350+ products…",
  "Generating inventory & batch data…",
  "Configuring 4 automation workflows…",
  "Building activity timeline…",
  "Preparing AI insights…",
  "Almost ready…",
];

const LOAD_STEPS_FA = [
  "در حال اتصال به فروشگاه لندن…",
  "بارگذاری بیش از ۳۵۰ محصول…",
  "تولید اطلاعات موجودی و دسته‌ها…",
  "پیکربندی ۴ گردش‌کار هوشمند…",
  "ایجاد خط زمانی فعالیت‌ها…",
  "آماده‌سازی تحلیل‌های هوش مصنوعی…",
  "تقریباً آماده است…",
];

function StatCard({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="text-center px-2">
      <div className={cn("text-xl sm:text-2xl font-bold", color)}>{value}</div>
      <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
        {label}
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:border-green-300 hover:shadow-md transition-all group cursor-default">
      <div className="w-9 h-9 rounded-lg bg-green-50 flex items-center justify-center mb-3 group-hover:bg-green-100 transition-colors">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  );
}

export function LandingPage({ onEnterApp }: LandingPageProps) {
  const { enterDemo } = useDemoStore();
  const { language, setLanguage } = useLanguageStore();
  const isFa = language === "fa";
  const loadSteps = isFa ? LOAD_STEPS_FA : LOAD_STEPS_EN;

  const [isLoading, setIsLoading] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [progress, setProgress] = useState(0);

  async function handleTryDemo() {
    setIsLoading(true);
    for (let i = 0; i < loadSteps.length; i++) {
      setStepIdx(i);
      setProgress(Math.round(((i + 1) / loadSteps.length) * 100));
      await new Promise((r) => setTimeout(r, 380));
    }

    // Inject demo data
    useAppStore.setState({
      batches: demoBatches,
      operations: demoOperations,
      notifications: demoNotifications,
      activities: demoActivities,
      currentStoreId: "demo-store",
    });
    useSettingsStore.setState((s) => ({
      stores: [DEMO_STORE, ...s.stores.filter((st) => st.id !== "demo-store")],
    }));

    enterDemo();
    onEnterApp();
  }

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-green-50/20"
      dir={isFa ? "rtl" : "ltr"}
    >
      {/* Nav */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-green-700 flex items-center justify-center shadow-sm">
            <Leaf size={15} className="text-white" />
          </div>
          <span className="text-base font-bold text-slate-900">FreshFlow</span>
          <span className="text-xs bg-green-100 text-green-700 rounded-full px-2 py-0.5 font-medium">
            Beta
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Toggle Button */}
          <button
            onClick={() => setLanguage(isFa ? "en" : "fa")}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Globe size={14} className="text-green-700" />
            <span>{isFa ? "English" : "فارسی"}</span>
          </button>

          <button
            onClick={onEnterApp}
            className="text-sm text-slate-600 hover:text-slate-900 transition-colors flex items-center gap-1 font-medium"
          >
            <span>{isFa ? "ورود به برنامه" : "Open App"}</span>
            <ChevronRight size={14} className={cn(isFa && "rotate-180")} />
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 pt-16 pb-24 space-y-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center space-y-6"
        >
          <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-full px-3 py-1 text-xs font-semibold text-green-700">
            <Sparkles size={11} />{" "}
            {isFa
              ? "مدیریت هوشمند فروشگاه‌های زنجیره‌ای و سوپرمارکت"
              : "Smart Operations for Modern Grocery Stores"}
          </div>

          <h1 className="text-4xl sm:text-[52px] font-bold text-slate-900 leading-[1.12] tracking-tight">
            {isFa ? (
              <>
                جلوگیری از ضرر و زیان
                <br />
                <span className="text-green-700">
                  انقضای محصولات سوپرمارکتی
                </span>
              </>
            ) : (
              <>
                Stop losing money to
                <br />
                <span className="text-green-700">expired products</span>
              </>
            )}
          </h1>

          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            {isFa
              ? "فرش‌فلو فرآیند ردیابی تاریخ انقضا، جلوگیری از ضایعات و مدیریت عملیات فروشگاه را کاملاً خودکار می‌کند — تا تیم شما به جای چک کردن دستی تاریخ‌ها، روی مشتریان تمرکز کند."
              : "FreshFlow automates expiry tracking, waste prevention, and store operations — so your team focuses on customers, not chasing shelf dates."}
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <motion.button
              onClick={handleTryDemo}
              disabled={isLoading}
              whileHover={!isLoading ? { scale: 1.02 } : undefined}
              whileTap={!isLoading ? { scale: 0.98 } : undefined}
              className={cn(
                "inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold text-sm shadow-lg shadow-green-700/20 transition-all min-w-[220px] justify-center",
                isLoading
                  ? "bg-green-600 text-white cursor-wait"
                  : "bg-green-700 text-white hover:bg-green-800",
              )}
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="3"
                      className="opacity-25"
                    />
                    <path
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      className="opacity-75"
                    />
                  </svg>
                  <span className="truncate text-left flex-1">
                    {loadSteps[stepIdx]}
                  </span>
                </>
              ) : (
                <>
                  <Play size={15} className="fill-white flex-shrink-0" />
                  {isFa ? "ورود به دمو تعاملی فروشگاه" : "Try Interactive Demo"}
                </>
              )}
            </motion.button>

            <button
              onClick={onEnterApp}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm text-slate-700 hover:bg-slate-100 transition-colors border border-slate-200"
            >
              <span>{isFa ? "ورود مستقیم به برنامه" : "Open Dashboard"}</span>
              <ArrowRight size={15} className={cn(isFa && "rotate-180")} />
            </button>
          </div>

          {/* Loading progress */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-xs mx-auto"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                <span>Loading demo…</span>
                <span>{progress}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-green-600 rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}

          <p className="text-xs text-slate-400">
            No signup required · Bilingual EN / فارسی · Realistic UK grocery
            data
          </p>
        </motion.div>

        {/* Demo data preview */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
        >
          <div className="bg-gradient-to-r from-green-700 to-green-600 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
                <Leaf size={16} className="text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">
                  {isFa ? "فروشگاه تست" : "Test Market"}
                </p>
                <p className="text-green-200 text-xs">
                  {isFa ? "نام مدیر, مدیر · فروشگاه تست, ۱۲۳۴۵۶۷۸" : "John Doe, Manager · Test Market, 12345678"}
                </p>
              </div>
              <div className="ml-auto hidden sm:flex items-center gap-1.5 bg-white/20 rounded-full px-3 py-1 text-xs text-white font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-300 animate-pulse" />
                {isFa ? "دموی زنده" : "Live Demo"}
              </div>
            </div>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 divide-x divide-slate-100">
              <StatCard
                value={isFa ? "۱۲۴,۵۰۰ تومان" : "£124,500"}
                label={isFa ? "ارزش موجودی" : "Inventory Value"}
                color="text-slate-900"
              />
              <StatCard value={isFa ? "۱,۲۴۰ تومان" : "£1,240"} label={isFa ? "در معرض خطر" : "At Risk"} color="text-red-600" />
              <StatCard value={isFa ? "+۳۵۰" : "350+"} label={isFa ? "محصولات" : "Products"} color="text-blue-700" />
              <StatCard value={isFa ? "۱۸" : "18"} label={isFa ? "تأمین‌کنندگان" : "Suppliers"} color="text-slate-700" />
              <StatCard value={isFa ? "٪۸۷" : "87%"} label={isFa ? "اتوماسیون" : "Automation"} color="text-green-700" />
              <StatCard value={isFa ? "۵۳۴" : "534"} label={isFa ? "اجرای گردش‌کار" : "WF Runs"} color="text-purple-700" />
            </div>
          </div>
        </motion.div>

        {/* Features grid */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <p className="text-center text-xs font-semibold text-slate-400 uppercase tracking-wider mb-6">
            {isFa ? "هرآنچه فروشگاه شما نیاز دارد" : "Everything your store needs"}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: <AlertTriangle size={16} className="text-red-500" />,
                title: isFa ? "مرکز تاریخ انقضا" : "Expiry Centre",
                description: isFa
                  ? "نظارت در زمان واقعی گروه بندی شده بر اساس فوریت. قبل از انقضای محصولات و هدر رفتن ارزش اقدام کنید."
                  : "Real-time monitoring grouped by urgency. Act before products expire and waste value.",
              },
              {
                icon: <GitBranch size={16} className="text-blue-600" />,
                title: isFa ? "سازنده بصری گردش‌کار" : "Visual Workflow Builder",
                description: isFa
                  ? "اتوماسیون با کشیدن و رها کردن. محرک‌ها، شرایط و اقدامات — بدون نیاز به کدنویسی."
                  : "Drag-and-drop automation. Triggers, conditions, and actions — no code required.",
              },
              {
                icon: <Package size={16} className="text-green-700" />,
                title: isFa ? "موجودی بر اساس انقضا (FEFO)" : "FEFO Inventory",
                description: isFa
                  ? "اولین انقضا، اولین خروجی — با ردیابی کامل دسته‌ها همیشه بدانید کدام دسته را اول بفروشید."
                  : "First Expire, First Out — always know which batch to sell first with full batch tracking.",
              },
              {
                icon: <ClipboardList size={16} className="text-amber-600" />,
                title: isFa ? "عملیات هوشمند" : "Smart Operations",
                description: isFa
                  ? "وظایف خودکار محول شده به کارکنان. نماهای لیست و کانبان با ردیابی تکمیل."
                  : "Automated tasks assigned to staff. List and kanban views with completion tracking.",
              },
              {
                icon: <BarChart3 size={16} className="text-slate-600" />,
                title: isFa ? "بینش‌های هوش مصنوعی" : "AI Insights",
                description: isFa
                  ? "تحلیل پویای سلامت فروشگاه، الگوهای ضایعات و هشدارهای ریسک پیش‌بینی‌کننده."
                  : "Dynamic analysis of your store health, waste patterns, and predictive risk alerts.",
              },
              {
                icon: <ShieldCheck size={16} className="text-emerald-600" />,
                title: isFa ? "نمره سلامت فروشگاه" : "Store Health Score",
                description: isFa
                  ? "یک نمره واحد برای موجودی، کارایی گردش‌کار و بهره‌وری کارکنان."
                  : "A single score for inventory, workflow efficiency, and staff productivity.",
              },
            ].map((f) => (
              <FeatureCard key={f.title} {...f} />
            ))}
          </div>
        </motion.div>

        {/* Tags */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center space-y-3"
        >
          <div className="flex items-center justify-center flex-wrap gap-x-6 gap-y-1 text-xs text-slate-400">
            {(isFa
              ? [
                  "سازگار با FEFO",
                  "دوزبانه انگلیسی/فارسی",
                  "پشتیبانی از راست‌چین",
                  "مبتنی بر هوش مصنوعی",
                  "خروجی CSV/PDF",
                  "پالت دستورات",
                  "پشتیبانی از حالت تاریک",
                ]
              : [
                  "FEFO Compliant",
                  "Bilingual EN/FA",
                  "RTL Support",
                  "AI Powered",
                  "Export CSV/PDF",
                  "Command Palette",
                  "Dark-ready",
                ]
            ).map((tag) => (
              <span key={tag} className="flex items-center gap-1">
                <CheckCircle2 size={11} className="text-green-500" /> {tag}
              </span>
            ))}
          </div>

        </motion.div>
      </main>
    </div>
  );
}
