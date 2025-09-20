import { supabase } from './supabase';

export type OAuthProvider = 'google' | 'github' | 'discord' | 'twitter';

export interface OAuthUser {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  provider: string;
}

export const signInWithOAuth = async (provider: OAuthProvider) => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    return { data, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : `Failed to sign in with ${provider}`;
    return { data: null, error: errorMessage };
  }
};

export const handleOAuthCallback = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    if (data.session?.user) {
      // Create or update user profile
      await createOAuthUserProfile(data.session.user);
      return { user: data.session.user, error: null };
    }

    return { user: null, error: 'No session found' };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to handle OAuth callback';
    return { user: null, error: errorMessage };
  }
};

const createOAuthUserProfile = async (user: { id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }) => {
  try {
    // Check if user profile already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (existingUser) {
      // Update existing user
      const { error: updateError } = await supabase
        .from('users')
        .update({
          email: user.email,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name,
          avatar_url: user.user_metadata?.avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
      return existingUser;
    }

    // Create new user profile
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatar_url: user.user_metadata?.avatar_url,
        auth_method: 'oauth',
        provider: user.app_metadata?.provider,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return newUser;
  } catch (error) {
    console.error('Error creating OAuth user profile:', error);
    throw error;
  }
};

export const getOAuthProviders = () => {
  return [
    {
      name: 'google',
      displayName: 'Google',
      icon: '🔍',
      color: 'bg-red-600 hover:bg-red-700',
    },
    {
      name: 'github',
      displayName: 'GitHub',
      icon: '🐙',
      color: 'bg-gray-800 hover:bg-gray-900',
    },
    {
      name: 'discord',
      displayName: 'Discord',
      icon: '🎮',
      color: 'bg-indigo-600 hover:bg-indigo-700',
    },
    {
      name: 'twitter',
      displayName: 'Twitter',
      icon: '🐦',
      color: 'bg-blue-500 hover:bg-blue-600',
    },
  ];
};