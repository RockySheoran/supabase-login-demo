// src/interfaces/types.ts
export interface User {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string | null;
  provider?: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null; // For soft deletes
}
export interface JwtPayload {
  id: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: User;
}