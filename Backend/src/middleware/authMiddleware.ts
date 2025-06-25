import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthRequest, JwtPayload } from '../interfaces/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extend the standard Request interface to include the authorization header
interface AuthenticatedRequest extends Request {
  headers: {
    authorization?: string;
  } & Request['headers'];
  cookies: {
    token?: string;
  };
  user?: {
    id: string;
    email: string;
  };
}

export const protect = (req: AuthenticatedRequest, res: Response, next: NextFunction): any => {
  let token: string | undefined;

  // Check authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } 
  // Check cookies
  else if (req.cookies?.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized to access this route',
    });
  }
};