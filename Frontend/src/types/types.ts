export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  provider?: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  token?: string;
  user?: User;
  url?: string;
}