import { Request, Response } from 'express';
import { supabase } from '../config/supabaseClient';
import { generateToken } from '../utils/generateToken';
import { User } from '../interfaces/types';
import { createUser, getUserById, updateUser } from '../models/userModel';
import '../interfaces/express';

export const loginWithEmail = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required',
    });
  }

  try {
    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error('Email login auth error:', authError);
      return res.status(401).json({
        success: false,
        message: authError?.message || 'Invalid email or password',
      });
    }

    // 2. Get or create user profile
    let user = await getUserById(authData.user.id);
    
    if (!user) {
      console.log('Creating new user profile for:', authData.user.id);
      user = await createUser({
        id: authData.user.id,
        email: authData.user.email || '',
        name: authData.user.user_metadata?.name || authData.user.email?.split('@')[0] || 'User',
        avatar_url: authData.user.user_metadata?.avatar_url || null,
        provider: 'email',
      });

      if (!user) {
        console.error('Failed to create user profile');
        return res.status(500).json({
          success: false,
          message: 'Failed to create user profile',
        });
      }
    }

    // 3. Generate JWT token
    const token = generateToken({
      id: authData.user.id,
      email: authData.user.email || '',
    });

    // 4. Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // Changed from strict for OAuth compatibility
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: '/',
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
      message: 'Internal server error',
    });
  }
};

export const loginWithProvider = async (req: Request, res: Response): Promise<any> => {
  const { provider } = req.params;

  if (!['google', 'github'].includes(provider)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid provider',
    });
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as 'google' | 'github',
      options: {
        redirectTo: `${process.env.BACKEND_URL}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
    

    if (error || !data.url) {
      console.error('Provider login error:', error);
      return res.status(400).json({
        success: false,
        message: error?.message || 'Failed to initiate OAuth login',
      });
    }

    return res.status(200).json({
      success: true,
      url: data.url,
    });

  } catch (err) {
    console.error('Provider login error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const handleProviderCallback = async (req: Request, res: Response): Promise<void> => {
  const { code, error: oauthError, error_description } = req.query;
  console.log(code, oauthError, error_description);

  // Handle OAuth errors
  if (oauthError) {
    console.error('OAuth callback error:', { oauthError, error_description });
    return res.redirect(`${process.env.CLIENT_URL}/login?error=${encodeURIComponent(error_description as string || 'OAuth failed')}`);
  }

  if (!code || typeof code !== 'string') {
    console.error('Invalid authorization code:', code);
    return res.redirect(`${process.env.CLIENT_URL}/login?error=invalid_auth_code`);
  }

  try {
    // 1. Exchange code for session
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError || !sessionData.session) {
      console.error('Session exchange failed:', sessionError);
      return res.redirect(`${process.env.CLIENT_URL}/login?error=session_exchange_failed`);
    }

    // 2. Get user details
    const { data: userData, error: userError } = await supabase.auth.getUser(sessionData.session.access_token);
    
    if (userError || !userData.user) {
      console.error('Failed to get user:', userError);
      return res.redirect(`${process.env.CLIENT_URL}/login?error=user_not_found`);
    }

    // 3. Ensure user exists in Auth system and database
    let user = userData.user;
    
    if (!user) {
      // Create new user directly in Auth system
      const { data: createdUser, error: createError } = await supabase.auth.admin.createUser({
        id: userData.user.id,
        email: userData.user.email || `${userData.user.id}@${userData.user.app_metadata?.provider || 'oauth'}.com`,
        user_metadata: {
          name: userData.user.user_metadata?.name || 
               userData.user.user_metadata?.full_name || 
               userData.user.email?.split('@')[0] || 
               'User',
          avatar_url: userData.user.user_metadata?.avatar_url || 
                     userData.user.user_metadata?.picture || 
                     null
        },
        app_metadata: {
          provider: userData.user.app_metadata?.provider || 'oauth'
        },
        email_confirm: true // Mark email as confirmed if coming from OAuth
      });

      if (createError || !createdUser) {
        console.error('Failed to create user in Auth system:', createError);
        return res.redirect(`${process.env.CLIENT_URL}/login?error=user_creation_failed`);
      }

      // user = createdUser.user;
      console.log(createdUser)
    }

    // 4. Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email || user.id,
    });

    // 5. Set cookie and redirect
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/',
    });

    return res.redirect(`${process.env.CLIENT_URL}/auth/callback?token=${token}`);

  } catch (err) {
    console.error('Unexpected callback error:', err);
    return res.redirect(`${process.env.CLIENT_URL}/login?error=internal_server_error`);
  }
};

export const getProfile = async (req: Request, res: Response): Promise<any> => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Not authenticated',
    });
  }
  console.log("req.user:", req.user);

  try {
       const { data, error } = await supabase.auth.admin.getUserById(req.user.id);
    if (error) {
      console.error('Failed to get user:', error);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    console.log("data:", data);
    console.log("user:", data.user);
    return res.status(200).json({
      success: true,
      user: data.user,
    });

  } catch (err) {
    console.error('Profile error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

export const logout = async (req: Request, res: Response): Promise<any> => {
  try {
    // Clear Supabase session
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Supabase logout error:', error);
    }

    // Clear HTTP-only cookie
    res.clearCookie('token', {
      path: '/',
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });

  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};