import api from './api';
import { User, ApiResponse } from '../types';

interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  async register(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/register', {
      email,
      password,
    });
    return response.data.data!;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', {
      email,
      password,
    });
    return response.data.data!;
  },

  async getProfile(): Promise<User> {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/profile');
    return response.data.data!.user;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};
