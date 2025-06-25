import { supabase } from '../config/supabaseClient';
import { User } from '../interfaces/types';

export const getUserById = async (id: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching user:', error?.message);
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    avatar: data.avatar_url,
    provider: data.provider,
  };
};

export const updateUser = async (
  id: string,
  updates: Partial<Omit<User, 'id'>>
): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating user:', error?.message);
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    avatar: data.avatar_url,
    provider: data.provider,
  };
};

export const createUser = async (userData: Omit<User, 'id'>): Promise<User | null> => {
  const { data, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single();

  if (error || !data) {
    console.error('Error creating user:', error?.message);
    return null;
  }

  return {
    id: data.id,
    email: data.email,
    name: data.name,
    avatar: data.avatar_url,
    provider: data.provider,
  };
};