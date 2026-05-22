import { create } from 'zustand';
import { apiFetch } from '@/lib/api';

export interface CreationOption {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description: string | null;
  contextPrompt: string;
  isActive: boolean;
  sortOrder: number;
}

interface CreationOptionsState {
  options: CreationOption[];
  isLoading: boolean;
  error: string | null;
  fetchOptions: () => Promise<void>;
}

export const useCreationOptionsStore = create<CreationOptionsState>((set) => ({
  options: [],
  isLoading: false,
  error: null,
  fetchOptions: async () => {
    set({ isLoading: true, error: null });
    try {
      // Fetch only active options for the client
      const options = await apiFetch<CreationOption[]>('/api/creation-options?includeInactive=false');
      set({ options, isLoading: false });
    } catch (error) {
      console.error('Error fetching creation options:', error);
      set({ error: 'Failed to load options', isLoading: false });
    }
  },
}));
