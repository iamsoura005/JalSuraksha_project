'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { AuthUser, getCurrentUser } from '@/lib/auth';
import { Web3User, getCurrentWeb3User, disconnectWallet } from '@/lib/web3auth-simple';

interface AuthContextType {
  user: AuthUser | null;
  web3User: Web3User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  connectWeb3: () => Promise<void>;
  isWeb3Connected: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  web3User: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
  connectWeb3: async () => {},
  isWeb3Connected: false,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [web3User, setWeb3User] = useState<Web3User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    }
  };

  const connectWeb3 = async () => {
    try {
      const { connectWallet } = await import('@/lib/web3auth-simple');
      const { user: web3UserData, error } = await connectWallet();
      
      if (error) {
        console.error('Web3 connection error:', error);
        return;
      }
      
      if (web3UserData) {
        setWeb3User(web3UserData);
      }
    } catch (error) {
      console.error('Error connecting Web3:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      
      // Also disconnect Web3 if connected
      if (web3User) {
        await disconnectWallet();
        setWeb3User(null);
      }
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (session?.user) {
          await refreshUser();
        }

        // Check for Web3 connection
        const web3UserData = await getCurrentWeb3User();
        if (web3UserData) {
          setWeb3User(web3UserData);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await refreshUser();
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
        setLoading(false);
      }
    );

    // Listen for Web3 account changes
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = async (...args: unknown[]) => {
        const accounts = args[0] as string[];
        if (accounts.length === 0) {
          setWeb3User(null);
        } else {
          const web3UserData = await getCurrentWeb3User();
          setWeb3User(web3UserData);
        }
      };

      const handleChainChanged = async () => {
        const web3UserData = await getCurrentWeb3User();
        setWeb3User(web3UserData);
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return () => {
        subscription.unsubscribe();
        if (window.ethereum) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
          window.ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    web3User,
    loading,
    signOut: handleSignOut,
    refreshUser,
    connectWeb3,
    isWeb3Connected: !!web3User?.isConnected,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};