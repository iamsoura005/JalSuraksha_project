import { create } from 'zustand';
import { SampleData } from '@/types';

interface SampleStore {
  samples: SampleData[];
  setSamples: (samples: SampleData[]) => void;
  addSample: (sample: SampleData) => void;
  removeSample: (id: string) => void;
  clearSamples: () => void;
}

export const useSamplesStore = create<SampleStore>((set) => ({
  samples: [],
  setSamples: (samples) => set({ samples }),
  addSample: (sample) => set((state) => ({ samples: [...state.samples, sample] })),
  removeSample: (id) => set((state) => ({ 
    samples: state.samples.filter(sample => sample.id !== id) 
  })),
  clearSamples: () => set({ samples: [] })
}));