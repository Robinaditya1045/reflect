"use client";

import React, { useState } from 'react';
import { useWallet } from '@/context/WalletContext';

export const UsernameModal = () => {
  const { isUsernameModalOpen, setIsUsernameModalOpen, completeOnboarding, isLoading, walletAddress } = useWallet();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  if (!isUsernameModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim()) {
      setError('Username is required');
      return;
    }
    
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    
    try {
      await completeOnboarding(username);
    } catch (err) {
      setError('Failed to save username. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-[#0d1117] border border-[#30363d] rounded-md p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold text-white mb-4">Welcome to Reflect!</h2>
        <p className="text-[#8b949e] mb-6">
          Please create a username to complete your account setup.
        </p>
        
        {error && (
          <div className="bg-[#301f21] border border-[#f85149] text-[#f85149] p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
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
              onClick={() => setIsUsernameModalOpen(false)}
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] hover:border-[#6e7681] text-white font-medium rounded-md transition duration-200 ease-in-out"
            >
              Cancel
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
      </div>
    </div>
  );
};
