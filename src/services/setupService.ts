import apiClient from '@/lib/api/axios';
import {
  WizardDraftState,
  SetupPublishPayload,
  SetupPublishResponse,
} from '@/types/setup';
import { mockSetupService } from '@/mocks/mockSetupService';

const isMockMode = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

/**
 * Service Layer for Setup Wizard API integration.
 * In development / mock mode, explicitly uses mockSetupService without sending requests to fictional URLs.
 * When a real backend is provided (NEXT_PUBLIC_USE_MOCK=false), uses apiClient.
 */
export const setupService = {
  async getDraft(): Promise<WizardDraftState> {
    if (isMockMode) {
      return mockSetupService.getDraft();
    }
    const response = await apiClient.get<WizardDraftState>('/setup/draft');
    return response.data;
  },

  async saveDraft(draft: Partial<WizardDraftState>): Promise<{ success: boolean; message: string }> {
    if (isMockMode) {
      return mockSetupService.saveDraft(draft);
    }
    const response = await apiClient.post<{ success: boolean; message: string }>('/setup/draft', draft);
    return response.data;
  },

  async publishConfiguration(payload: SetupPublishPayload): Promise<SetupPublishResponse> {
    if (isMockMode) {
      return mockSetupService.publish(payload);
    }
    const response = await apiClient.post<SetupPublishResponse>('/setup/publish', payload);
    return response.data;
  },
};

export default setupService;
