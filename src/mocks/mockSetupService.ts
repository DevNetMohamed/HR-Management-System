import {
  WizardDraftState,
  SetupPublishPayload,
  SetupPublishResponse,
} from '@/types/setup';
import { initialSetupData } from '@/mocks/mockSetupData';

// In-memory mock store for temporary frontend development
let inMemoryDraft: WizardDraftState = { ...initialSetupData };

export const mockSetupService = {
  async getDraft(): Promise<WizardDraftState> {
    // Simulating immediate local mock return
    return JSON.parse(JSON.stringify(inMemoryDraft));
  },

  async saveDraft(draft: Partial<WizardDraftState>): Promise<{ success: boolean; message: string }> {
    // Simulated mock save (does not persist across browser reload, per specification)
    inMemoryDraft = {
      ...inMemoryDraft,
      ...draft,
    };
    return {
      success: true,
      message: 'Draft saved locally (mock mode)',
    };
  },

  async publish(payload: SetupPublishPayload): Promise<SetupPublishResponse> {
    // Simulated publish response
    inMemoryDraft.isPublishedDone = true;
    return {
      success: true,
      version: payload.version || 'v1.0',
      publishedAt: new Date().toISOString(),
      message: 'Configuration published successfully (mock mode)',
    };
  },

  resetMock(): void {
    inMemoryDraft = JSON.parse(JSON.stringify(initialSetupData));
  },
};
