// src/interfaces/types.ts
export interface User {
  id: string;
  email: string;
  name?: string;  // Made optional with ?
  avatar?: string;
  provider?: string;
}

export interface JwtPayload {
  id: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: User;
}