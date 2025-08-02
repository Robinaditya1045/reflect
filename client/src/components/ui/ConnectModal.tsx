"use client";

import React, { useState, useEffect } from 'react';
import { createUser, getUserByWalletAddress, onboardUser } from '@/lib/actions/user.actions';

type ConnectModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConnect: (address: string, username: string | null, isOnboarded: boolean) => void;
};

enum Step {
  CONNECT_WALLET,
  ENTER_USERNAME
}

export const ConnectModal = ({ isOpen, onClose, onConnect }: ConnectModalProps) => {
  const [step, setStep] = useState<Step>(Step.CONNECT_WALLET);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(Step.CONNECT_WALLET);
      setUsername('');
      setError('');
    }
  }, [isOpen]);
  
  // If wallet is already connected, check its status
  useEffect(() => {
    const checkWalletStatus = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
            await checkUserExists(accounts[0]);
          }
        } catch (error) {
          console.error('Error checking wallet connection:', error);
        }
      }
    };
    
    if (isOpen && step === Step.CONNECT_WALLET) {
      checkWalletStatus();
    }
  }, [isOpen, step]);
  
  const connectWallet = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const address = accounts[0];
        setWalletAddress(address);
        
        await checkUserExists(address);
      } else {
        setError('Please install MetaMask to use this application');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const checkUserExists = async (address: string) => {
    setIsLoading(true);
    try {
      // Try to get existing user
      const user = await getUserByWalletAddress(address);
      
      // If user exists and is onboarded, close modal and notify parent
      if (user.isonboarded) {
        onConnect(address, user.username, true);
        onClose();
      } else {
        // User exists but not onboarded, move to username step
        setStep(Step.ENTER_USERNAME);
      }
    } catch (error) {
      console.error('User not found, creating new user:', error);
      
      try {
        // Create new user
        await createUser(address);
        setStep(Step.ENTER_USERNAME);
      } catch (createError) {
        console.error('Error creating user:', createError);
        setError('Failed to create user. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    if (!walletAddress) {
      setError('Wallet not connected');
      return;
    }
    
    setIsLoading(true);
    try {
      await onboardUser(walletAddress, username);
      onConnect(walletAddress, username, true);
      onClose();
    } catch (err) {
      console.error('Error setting username:', err);
      setError('Failed to save username. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-6 max-w-md w-full">
        {step === Step.CONNECT_WALLET ? (
          <>
            <h2 className="text-xl font-semibold text-white mb-4">Connect Wallet</h2>
            <p className="text-[#8b949e] mb-6">
              Connect your wallet to use Reflect.
            </p>
            
            {error && (
              <div className="bg-[#301f21] border border-[#f85149] text-[#f85149] p-3 rounded-md mb-4">
                {error}
              </div>
            )}
            
            <button
              onClick={connectWallet}
              disabled={isLoading}
              className="w-full py-2 px-4 bg-[#238636] hover:bg-[#2ea043] border border-[#238636] text-white text-center font-medium rounded-md transition duration-200 ease-in-out"
            >
              {isLoading ? 'Connecting...' : 'Connect with MetaMask'}
            </button>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={onClose}
                className="text-[#8b949e] hover:text-white text-sm"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-white mb-4">Set Username</h2>
            <p className="text-[#8b949e] mb-6">
              Please create a username to complete your account setup.
            </p>
            
            {error && (
              <div className="bg-[#301f21] border border-[#f85149] text-[#f85149] p-3 rounded-md mb-4">
                {error}
              </div>
            )}
            
            <form onSubmit={handleUsernameSubmit}>
              <div className="mb-4">
                <label htmlFor="username" className="block text-sm font-medium text-[#8b949e] mb-1">
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-[#161b22] border border-[#30363d] rounded-md p-2 text-white focus:border-[#1f6feb] focus:outline-none"
                  placeholder="Enter a username"
                />
              </div>
              
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setStep(Step.CONNECT_WALLET)}
                  disabled={isLoading}
                  className="flex-1 py-2 px-4 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] hover:border-[#6e7681] text-white font-medium rounded-md transition duration-200 ease-in-out"
                >
                  Back
                </button>
                
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 py-2 px-4 bg-[#238636] hover:bg-[#2ea043] border border-[#238636] text-white font-medium rounded-md transition duration-200 ease-in-out"
                >
                  {isLoading ? 'Saving...' : 'Save Username'}
                </button>
              </div>
              
              <div className="mt-4 text-xs text-[#8b949e]">
                Connected wallet: {walletAddress ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}` : ''}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
