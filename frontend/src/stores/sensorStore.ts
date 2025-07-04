import { create } from 'zustand';
import { DadosSensor, Estatisticas } from '@/types';

interface SensorStore {
  // Estado
  ultimasLeituras: DadosSensor[];
  ultimaLeitura: DadosSensor | null;
  estatisticas: Estatisticas | null;
  alertas: DadosSensor[];
  isLoading: boolean;
  error: string | null;
  
  // Ações
  setUltimasLeituras: (leituras: DadosSensor[]) => void;
  setEstatisticas: (stats: Estatisticas) => void;
  setAlertas: (alertas: DadosSensor[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Dados em tempo real
  isRealTimeEnabled: boolean;
  toggleRealTime: () => void;
}

export const useSensorStore = create<SensorStore>((set, get) => ({
  // Estado inicial
  ultimasLeituras: [],
  ultimaLeitura: null,
  estatisticas: null,
  alertas: [],
  isLoading: false,
  error: null,
  isRealTimeEnabled: false,
  
  // Ações
  setUltimasLeituras: (leituras) => {
    set({ 
      ultimasLeituras: leituras,
      ultimaLeitura: leituras[0] || null 
    });
  },
  
  setEstatisticas: (stats) => set({ estatisticas: stats }),
  setAlertas: (alertas) => set({ alertas }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  toggleRealTime: () => set((state) => ({ 
    isRealTimeEnabled: !state.isRealTimeEnabled 
  })),
}));