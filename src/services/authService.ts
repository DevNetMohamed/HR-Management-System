import { apiClient } from '@/lib/api/axios';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthUser {
  email: string;
  name: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: AuthUser;
}

const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK !== 'false';

/**
 * Authentication service contract prepared for future backend integration.
 * In development / mock mode, validates input format and simulates network latency
 * without persisting real credentials or storing passwords.
 */
export const authService = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    if (USE_MOCK) {
      // Simulate network roundtrip latency
      await new Promise((resolve) => setTimeout(resolve, 650));

      const emailTrimmed = credentials.email.trim().toLowerCase();

      // Basic client-side sanity check for mock simulation
      if (!emailTrimmed || !credentials.password) {
        throw new Error('Email and password are required.');
      }

      // Check format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailTrimmed)) {
        throw new Error('Please enter a valid email address.');
      }

      // Return simulated success response
      return {
        success: true,
        message: 'Sign in simulated successfully (Development Mode).',
        user: {
          email: emailTrimmed,
          name: emailTrimmed.split('@')[0].replace(/[._-]/g, ' '),
          role: 'HR Administrator',
        },
      };
    }

    // Real API integration endpoint when backend is ready
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },
};
