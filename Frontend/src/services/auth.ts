import type { AuthResponse } from '../types/types';
import api from './api';


export const loginWithEmail = async (email: string, password: string) => {
  const response = await api.post<AuthResponse>('/auth/login/email', {
    email,
    password,
  });
  return response.data;
};

export const loginWithProvider = async (provider: 'google' | 'github') => {
  const response = await api.get<AuthResponse>(`/auth/login/${provider}`);
  return response.data;
};

export const getProfile = async () => {
  const response = await api.get<AuthResponse>('/auth/profile');
  return response.data;
};

export const logout = async () => {
  const response = await api.post<AuthResponse>('/auth/logout');
  return response.data;
};