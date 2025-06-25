import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { generateToken } from '../utils/generateToken';
import { User } from '../interfaces/types';
import { getUserById } from '../models/userModel';
import '../interfaces/express';

export const loginWithEmail = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  try {
    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return res.status(400).json({
        success: false,
        message: authError?.message || 'Authentication failed',
      });
    }

    // Get user profile from PostgreSQL database
    const user = await getUserById(authData.user.id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User profile not found',
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: authData.user.id,
      email: authData.user.email || '',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    return res.status(200).json({
      success: true,
      token,
      user,
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const loginWithProvider = async (req: Request, res: Response):Promise<any> => {
  const { provider } = req.params;
  console.log(provider)
console.log(`${process.env.BACKEND_URL}/api/auth/callback`)
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as 'google' | 'github',
      options: {
        redirectTo: `${process.env.BACKEND_URL}/api/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    console.log("111111111111111111111111111111111111111111")

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    console.log(data.url)
    

    return res.status(200).json({
      success: true,
      url: data.url,
    });
  } catch (err) {
    console.error('Provider login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const handleProviderCallback = async (req: Request, res: Response):Promise<any> => {
  console.log("dfsdcs")
  const { code ,error: oauthError } = req.query;
    
  console.log("code", code)
  console.log("dddddddddddddddddddddddddddddddddddddddddddddddddd")

  if (!code || typeof code !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Invalid authorization code',
    });
  }

  try {
    // Exchange the code for a session
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
  console.log(sessionData)
    if (sessionError || !sessionData.session) {
      return res.status(400).json({
        success: false,
        message: sessionError?.message || 'Failed to authenticate',
      });
    }

    // Get the user from the session
    const { data: userData, error: userError } = await supabase.auth.getUser(sessionData.session.access_token);

    if (userError || !userData.user) {
      return res.status(400).json({
        success: false,
        message: userError?.message || 'User not found',
      });
    }

    // Get user profile from PostgreSQL database
    const user = await getUserById(userData.user.id);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User profile not found',
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: userData.user.id,
      email: userData.user.email || '',
    });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    // Redirect to frontend with token in query param for client-side storage
    return res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);
  } catch (err) {
    console.error('Callback error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const getProfile = async (req: Request, res: Response):Promise<any> => {
  try {
    if (!req?.user ) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Get user profile from PostgreSQL database
    const user = await getUserById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (err) {
    console.error('Profile error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};

export const logout = async (req: Request, res: Response):Promise<any> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.clearCookie('token');

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};