import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  full_name?: string;
  avatar_url?: string;
}

export interface SignUpData {
  email?: string;
  phone?: string;
  password: string;
  full_name: string;
}

export interface SignInData {
  email?: string;
  phone?: string;
  password: string;
}

// Sign up with email or phone
export const signUp = async (data: SignUpData) => {
  try {
    let authData;
    
    if (data.email) {
      authData = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          }
        }
      });
    } else if (data.phone) {
      authData = await supabase.auth.signUp({
        phone: data.phone,
        password: data.password,
        options: {
          data: {
            full_name: data.full_name,
          }
        }
      });
    } else {
      throw new Error('Email or phone number is required');
    }

    if (authData.error) throw authData.error;

    // Create user profile
    if (authData.data.user) {
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.data.user.id,
          email: data.email,
          phone: data.phone,
          full_name: data.full_name,
        });

      if (profileError) throw profileError;
    }

    return { data: authData.data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Sign in with email or phone
export const signIn = async (data: SignInData) => {
  try {
    let authData;
    
    if (data.email) {
      authData = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });
    } else if (data.phone) {
      authData = await supabase.auth.signInWithPassword({
        phone: data.phone,
        password: data.password,
      });
    } else {
      throw new Error('Email or phone number is required');
    }

    if (authData.error) throw authData.error;

    return { data: authData.data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};

// Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Get current user
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    
    if (!user) return null;

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      // If profile doesn't exist, create it
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          phone: user.phone,
          full_name: user.user_metadata?.full_name,
        });
      
      if (insertError) throw insertError;
      
      return {
        id: user.id,
        email: user.email,
        phone: user.phone,
        full_name: user.user_metadata?.full_name,
      };
    }

    return profile;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Update user profile
export const updateProfile = async (updates: Partial<AuthUser>) => {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('No user found');

    const { error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Send OTP for phone verification
export const sendOTP = async (phone: string) => {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });

    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
};

// Verify OTP
export const verifyOTP = async (phone: string, token: string) => {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: token,
      type: 'sms'
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
};