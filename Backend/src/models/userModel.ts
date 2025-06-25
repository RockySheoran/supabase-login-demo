import { supabase } from '../config/supabaseClient';
import { User } from '../interfaces/types';

export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code !== 'PGRST116') { // Ignore "No rows found" error
        console.error('Error fetching user:', error.message);
      }
      return null;
    }

    return data as User;
  } catch (err) {
    console.error('Unexpected error in getUserById:', err);
    return null;
  }
};

export const createUser = async (userData: Partial<User>): Promise<User | null> => {
  try {
    // Ensure required fields are present
    if (!userData.id || !userData.email) {
      throw new Error('Missing required user fields');
    }

    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: userData.id,
        email: userData.email,
        name: userData.name || userData.email.split('@')[0],
        avatar_url: userData.avatar_url || null,
        provider: userData.provider || 'email'
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating user:', error.message);
      return null;
    }

    return data as User;
  } catch (err) {
    console.error('Unexpected error in createUser:', err);
    return null;
  }
};

export const updateUser = async (
  id: string,
  updates: Partial<Omit<User, 'id'>>
): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user:', error.message);
      return null;
    }

    return data as User;
  } catch (err) {
    console.error('Unexpected error in updateUser:', err);
    return null;
  }
};