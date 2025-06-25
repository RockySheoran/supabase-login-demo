
import { supabase } from './config/supabaseClient';

import express from 'express';

import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import authRoutes from './routes/authRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorMiddleware';
import { Request,Response } from 'express';
const PORT = process.env.PORT || 5000;


const app = express();

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Authorization']
  })
);

  app.get('/', (req: Request, res: Response) => {
    res.status(200).json({
      status: 'success',
      message: 'API is running...',
      timestamp: new Date().toISOString(),
    });
  });
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/auth', authRoutes);

// 404 handler (must be after all other routes)
app.use(notFoundHandler);

// Error handler (must be last middleware)
app.use(errorHandler);






 app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


