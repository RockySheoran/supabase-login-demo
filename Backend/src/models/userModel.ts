import { supabase } from '../config/supabaseClient';
import { User } from '../interfaces/types';

/**
 * Get a user by their ID
 * @param id - User ID from Supabase auth
 * @returns User object or null if not found
 */
export const getUserById = async (id: string): Promise<User | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Handle "not found" differently from other errors
      if (error.code === 'PGRST116') { // No rows found
        return null;
      }
      throw error;
    }

    return data as User;
  } catch (error) {
    console.error('Error in getUserById:', error);
    return null;
  }
};

/**
 * Create a new user in the database
 * @param userData - Partial user data (must include id and email)
 * @returns Created User object or null if failed
 */
export const createUser = async (userData: Partial<User>): Promise<User | null> => {
  if (!userData.id || !userData.email) {
    console.error('Missing required fields for user creation');
    return null;
  }

  try {
    // Set default values if not provided
    const completeUserData = {
      ...userData,
      name: userData.name || userData.email.split('@')[0] || 'User',
      avatar_url: userData.avatar_url || null,
      provider: userData.provider || 'email',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('users')
      .insert([completeUserData])
      .select()
      .single();

    if (error) throw error;

    return data as User;
  } catch (error) {
    console.error('Error in createUser:', error);
    return null;
  }
};

/**
 * Update user information
 * @param id - User ID to update
 * @param updates - Partial user data to update
 * @returns Updated User object or null if failed
 */
export const updateUser = async (
  id: string,
  updates: Partial<Omit<User, 'id'>>
): Promise<User | null> => {
  try {
    // Always update the updated_at timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return data as User;
  } catch (error) {
    console.error('Error in updateUser:', error);
    return null;
  }
};

/**
 * Upsert user - creates if doesn't exist, updates if it does
 * @param userData - Complete user data
 * @returns User object or null if failed
 */
export const upsertUser = async (userData: Partial<User>): Promise<User | null> => {
  if (!userData.id) {
    console.error('User ID is required for upsert');
    return null;
  }

  try {
    const existingUser = await getUserById(userData.id);
    
    if (existingUser) {
      return await updateUser(userData.id, userData);
    } else {
      return await createUser(userData);
    }
  } catch (error) {
    console.error('Error in upsertUser:', error);
    return null;
  }
};

/**
 * Delete a user (soft delete by setting deleted_at timestamp)
 * @param id - User ID to delete
 * @returns true if successful, false if failed
 */
export const deleteUser = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('users')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;

    return true;
  } catch (error) {
    console.error('Error in deleteUser:', error);
    return false;
  }
};