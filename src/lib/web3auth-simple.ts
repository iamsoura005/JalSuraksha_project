import { supabase } from './supabase';

// Web3 Authentication Functions
export interface Web3User {
  address: string;
  chainId: number;
  isConnected: boolean;
}

export const connectWallet = async (): Promise<{ user: Web3User | null; error: string | null }> => {
  try {
    if (typeof window === 'undefined') {
      return { user: null, error: 'Window not available' };
    }

    // Check if MetaMask is installed
    if (!window.ethereum) {
      return { user: null, error: 'MetaMask is not installed. Please install MetaMask to continue.' };
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    }) as string[];

    if (!accounts || accounts.length === 0) {
      return { user: null, error: 'No accounts found' };
    }

    // Get chain ID
    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    }) as string;

    const user: Web3User = {
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      isConnected: true,
    };

    // Create or update user profile in Supabase
    await createWeb3UserProfile(user.address);

    return { user, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
    return { user: null, error: errorMessage };
  }
};

export const disconnectWallet = async (): Promise<{ error: string | null }> => {
  try {
    // Sign out from Supabase
    await supabase.auth.signOut();
    return { error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to disconnect wallet';
    return { error: errorMessage };
  }
};

export const signMessageForAuth = async (address: string): Promise<{ signature: string | null; error: string | null }> => {
  try {
    if (!window.ethereum) {
      return { signature: null, error: 'MetaMask not available' };
    }

    const message = `Sign this message to authenticate with JalSuraksha.\n\nAddress: ${address}\nTimestamp: ${Date.now()}`;
    
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [message, address],
    }) as string;

    return { signature, error: null };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to sign message';
    return { signature: null, error: errorMessage };
  }
};

const createWeb3UserProfile = async (address: string) => {
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('wallet_address', address)
      .single();

    if (existingUser) {
      return existingUser;
    }

    // Create new user profile
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        id: crypto.randomUUID(),
        wallet_address: address,
        full_name: `User ${address.slice(0, 6)}...${address.slice(-4)}`,
        auth_method: 'web3',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return newUser;
  } catch (error) {
    console.error('Error creating Web3 user profile:', error);
    throw error;
  }
};

export const getCurrentWeb3User = async (): Promise<Web3User | null> => {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      return null;
    }

    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    }) as string[];

    if (!accounts || accounts.length === 0) {
      return null;
    }

    const chainId = await window.ethereum.request({
      method: 'eth_chainId',
    }) as string;

    return {
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      isConnected: true,
    };
  } catch (error) {
    console.error('Error getting current Web3 user:', error);
    return null;
  }
};

// Type declarations for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}