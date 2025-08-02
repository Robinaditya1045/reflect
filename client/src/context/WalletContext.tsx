"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createUser, getUserByWalletAddress, onboardUser } from '@/lib/actions/user.actions';

type WalletContextType = {
  walletAddress: string | null;
  isOnboarded: boolean;
  username: string | null;
  isLoading: boolean;
  isUsernameModalOpen: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  completeOnboarding: (username: string) => Promise<void>;
  setIsUsernameModalOpen: (isOpen: boolean) => void;
};

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(false);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isUsernameModalOpen, setIsUsernameModalOpen] = useState<boolean>(false);

  // Check if wallet is connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            // Fetch user data
            await fetchUserData(accounts[0]);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };

    checkConnection();
  }, []);

  // Listen for account changes
  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          // User disconnected
          disconnectWallet();
        } else {
          // Account changed
          setWalletAddress(accounts[0]);
          fetchUserData(accounts[0]);
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);

  const fetchUserData = async (address: string) => {
    setIsLoading(true);
    try {
      const user = await getUserByWalletAddress(address);
      setIsOnboarded(user.isonboarded);
      setUsername(user.username || null);
      
      if (!user.isonboarded) {
        setIsUsernameModalOpen(true);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      // User doesn't exist, create a new user
      try {
        console.log('Creating new user for address:', address);
        console.log(typeof address, address);
        await createUser(address);
        setIsOnboarded(false);
        setUsername(null);
        setIsUsernameModalOpen(true);
      } catch (createError) {
        console.error('Error creating user:', createError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const connectWallet = async () => {
    setIsLoading(true);
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        
        // Try to fetch user data
        try {
          await fetchUserData(accounts[0]);
        } catch (error) {
          // User doesn't exist, create a new user
          await createUser(accounts[0]);
          setIsOnboarded(false);
          setUsername(null);
          setIsUsernameModalOpen(true);
        }
      } else {
        alert('Please install MetaMask to use this application');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setIsOnboarded(false);
    setUsername(null);
  };

  const completeOnboarding = async (username: string) => {
    if (!walletAddress) return;
    
    setIsLoading(true);
    try {
      await onboardUser(walletAddress, username);
      setIsOnboarded(true);
      setUsername(username);
      setIsUsernameModalOpen(false);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        isOnboarded,
        username,
        isLoading,
        isUsernameModalOpen,
        connectWallet,
        disconnectWallet,
        completeOnboarding,
        setIsUsernameModalOpen
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
