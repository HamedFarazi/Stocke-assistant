import { create } from 'zustand';

export interface SimulationEvent {
  id: string;
  time: string;
  type:
    | 'customer-purchase'
    | 'new-batch'
    | 'low-stock-detected'
    | 'expiry-workflow-triggered'
    | 'operation-assigned'
    | 'operation-completed'
    | 'supplier-delivery'
    | 'purchase-approved'
    | 'discount-applied'
    | 'product-expired';
  title: string;
  description: string;
  entityName: string;
  impactValue?: number;
  units?: number;
}

interface SimulationState {
  isRunning: boolean;
  isPaused: boolean;
  speed: 1 | 2 | 4;
  currentEventIndex: number;
  events: SimulationEvent[];
  completedSummary: {
    productsSold: number;
    revenueGenerated: number;
    operationsCreated: number;
    workflowsExecuted: number;
    wastePrevented: number;
    riskReduction: number;
  } | null;

  startSimulation: (events: SimulationEvent[]) => void;
  pauseSimulation: () => void;
  resumeSimulation: () => void;
  stopSimulation: () => void;
  setSpeed: (speed: 1 | 2 | 4) => void;
  nextStep: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  isRunning: false,
  isPaused: false,
  speed: 1,
  currentEventIndex: 0,
  events: [],
  completedSummary: null,

  startSimulation: (events) => {
    set({
      isRunning: true,
      isPaused: false,
      currentEventIndex: 0,
      events,
      completedSummary: null,
    });
  },

  pauseSimulation: () => set({ isPaused: true }),
  resumeSimulation: () => set({ isPaused: false }),

  stopSimulation: () => {
    const { events, currentEventIndex } = get();
    const processedEvents = events.slice(0, currentEventIndex);

    let productsSold = 0;
    let revenueGenerated = 0;
    let operationsCreated = 0;
    let workflowsExecuted = 0;

    processedEvents.forEach(e => {
      if (e.type === 'customer-purchase') {
        productsSold += e.units ?? 1;
        revenueGenerated += (e.impactValue ?? 1.99) * (e.units ?? 1);
      }
      if (e.type === 'operation-assigned' || e.type === 'expiry-workflow-triggered') {
        operationsCreated += 1;
      }
      if (e.type === 'expiry-workflow-triggered') {
        workflowsExecuted += 1;
      }
    });

    set({
      isRunning: false,
      isPaused: false,
      completedSummary: {
        productsSold,
        revenueGenerated: Math.round(revenueGenerated),
        operationsCreated,
        workflowsExecuted,
        wastePrevented: Math.round(revenueGenerated * 0.4),
        riskReduction: Math.min(95, processedEvents.length * 2),
      },
    });
  },

  setSpeed: (speed) => set({ speed }),

  nextStep: () => {
    const { currentEventIndex, events } = get();
    if (currentEventIndex + 1 >= events.length) {
      get().stopSimulation();
    } else {
      set({ currentEventIndex: currentEventIndex + 1 });
    }
  },
}));
