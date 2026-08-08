import { useEffect } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { useAppStore } from '@/stores/appStore';
import { useTranslation } from '@/hooks/useTranslation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, FastForward, Activity, Zap, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export function SimulationBanner() {
  const {
    isRunning, isPaused, speed, currentEventIndex, events,
    pauseSimulation, resumeSimulation, stopSimulation, setSpeed, nextStep
  } = useSimulationStore();
  const { addActivity, addNotification } = useAppStore();
  const { t, isRTL, language } = useTranslation();
  const isFa = language === 'fa';

  const currentEvent = events[currentEventIndex];

  // Drive simulation tick
  useEffect(() => {
    if (!isRunning || isPaused || !currentEvent) return;

    // Apply real state updates for current event
    if (currentEvent.type === 'customer-purchase') {
      addActivity({
        type: 'stock-updated',
        title: currentEvent.title,
        description: currentEvent.description,
        actorId: 'customer-sim',
        actorName: isFa ? 'مشتری (شبیه‌ساز)' : 'Customer (Simulator)',
        relatedEntityId: null,
        relatedEntityType: 'product',
        relatedEntityName: currentEvent.entityName,
      });
    } else if (currentEvent.type === 'expiry-workflow-triggered') {
      addNotification({
        type: 'workflow-executed',
        title: currentEvent.title,
        message: currentEvent.description,
        isRead: false,
        relatedEntityId: null,
        relatedEntityType: 'workflow',
      });
    }

    const delayMs = (2400 / speed);
    const timer = setTimeout(() => {
      nextStep();
    }, delayMs);

    return () => clearTimeout(timer);
  }, [isRunning, isPaused, currentEventIndex, speed, currentEvent]);

  if (!isRunning) return null;

  const progressPct = Math.round(((currentEventIndex + 1) / events.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="sticky top-0 z-30 bg-slate-900 text-white shadow-xl border-b border-green-500/30 px-4 py-3 rounded-xl mb-4"
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-3', isRTL && 'sm:flex-row-reverse')}>
        {/* Current Event Info */}
        <div className={cn('flex items-center gap-3 min-w-0', isRTL && 'flex-row-reverse')}>
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center flex-shrink-0 animate-pulse">
            <Zap size={16} />
          </div>
          <div className={cn('min-w-0', isRTL && 'text-right')}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-green-400">
                {isFa ? 'شبیه‌ساز زنده فروشگاه در حال اجرا…' : 'Live Store Simulation Running…'}
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/70">
                {currentEventIndex + 1} / {events.length} ({progressPct}%)
              </span>
            </div>
            {currentEvent && (
              <p className="text-xs font-semibold text-white/90 truncate mt-0.5">
                <span className="text-white/40">{currentEvent.time}:</span> {currentEvent.title}
              </p>
            )}
          </div>
        </div>

        {/* Playback Controls */}
        <div className={cn('flex items-center gap-2 flex-shrink-0', isRTL && 'flex-row-reverse')}>
          {/* Speed Toggle */}
          <div className="flex items-center bg-white/10 rounded-lg p-0.5 text-xs font-medium">
            {([1, 2, 4] as const).map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={cn(
                  'px-2 py-1 rounded-md transition-colors',
                  speed === s ? 'bg-green-600 text-white' : 'text-white/60 hover:text-white'
                )}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Pause / Resume */}
          {isPaused ? (
            <Button size="xs" variant="primary" leftIcon={<Play size={12} />} onClick={resumeSimulation}>
              {isFa ? 'ادامه' : 'Resume'}
            </Button>
          ) : (
            <Button size="xs" variant="outline" leftIcon={<Pause size={12} />} onClick={pauseSimulation} className="border-white/20 text-white hover:bg-white/10">
              {isFa ? 'توقف موقت' : 'Pause'}
            </Button>
          )}


          {/* Stop */}
          <Button size="xs" variant="danger" leftIcon={<Square size={12} />} onClick={stopSimulation}>
            {isFa ? 'پایان' : 'Stop'}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
