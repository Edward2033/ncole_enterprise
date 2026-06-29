import { apiFetch } from '@/services/api';

export type AiPortal = 'PUBLIC' | 'CUSTOMER' | 'VENDOR' | 'RIDER' | 'ADMIN';

export interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

export const aiApi = {
  chat: (message: string, history: ChatMessage[], portal: AiPortal) =>
    apiFetch<{ success: boolean; data: { reply: string } }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ message, history, portal }),
    }),
};

// Re-export portal type for convenience
export type { AiPortal as Portal };
