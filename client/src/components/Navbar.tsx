"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ConnectModal } from '@/components/ui/ConnectModal';

const Navbar = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Check if wallet is connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0 && localStorage.getItem('walletConnected') === 'true') {
            setWalletAddress(accounts[0]);
            
            // Get stored user data
            const storedUsername = localStorage.getItem('username');
            const storedOnboarded = localStorage.getItem('isOnboarded') === 'true';
            
            if (storedUsername) setUsername(storedUsername);
            setIsOnboarded(storedOnboarded);
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
          handleDisconnect();
        } else {
          // Account changed
          setWalletAddress(accounts[0]);
          // Clear user data on account change to force re-login
          setUsername(null);
          setIsOnboarded(false);
          localStorage.removeItem('username');
          localStorage.removeItem('isOnboarded');
          setIsModalOpen(true);
        }
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);
  
  const handleConnectClick = () => {
    setIsModalOpen(true);
  };
  
  const handleModalClose = () => {
    setIsModalOpen(false);
  };
  
  const handleConnect = (address: string, name: string | null, onboarded: boolean) => {
    setWalletAddress(address);
    setUsername(name);
    setIsOnboarded(onboarded);
    
    // Store in localStorage for persistence
    localStorage.setItem('walletConnected', 'true');
    if (name) localStorage.setItem('username', name);
    localStorage.setItem('isOnboarded', onboarded.toString());
  };
  
  const handleDisconnect = () => {
    setWalletAddress(null);
    setUsername(null);
    setIsOnboarded(false);
    
    // Clear localStorage
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('username');
    localStorage.removeItem('isOnboarded');
  };

  return (
    <>
      <div className='w-full h-16 bg-[#0d1117] border-b border-[#30363d] text-white flex items-center justify-between px-4'>
        <Link href="/" className='text-lg font-bold flex items-center'>
          <div className="h-4 w-4 rounded-full bg-[#238636] mr-2"></div>
          Reflect
        </Link>
        
        <div className='flex items-center space-x-4'>
          <Link 
            href="/create_games" 
            className="py-2 px-4 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] hover:border-[#6e7681] text-white text-center font-medium rounded-md transition duration-200 ease-in-out"
          >
            Create Game
          </Link>
          
          {walletAddress ? (
            <div className="flex items-center space-x-3">
              {isOnboarded && username && (
                <span className="text-sm text-white">{username}</span>
              )}
              
              <div className="py-1.5 px-3 bg-[#161b22] border border-[#30363d] rounded-md flex items-center">
                <span className="text-sm text-[#8b949e]">
                  {`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                </span>
              </div>
              
              <button
                onClick={handleDisconnect}
                className="py-2 px-4 bg-[#21262d] hover:bg-[#30363d] border border-[#30363d] hover:border-[#6e7681] text-white text-center font-medium rounded-md transition duration-200 ease-in-out"
              >
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectClick}
              disabled={isLoading}
              className="py-2 px-4 bg-[#238636] hover:bg-[#2ea043] border border-[#238636] text-white text-center font-medium rounded-md transition duration-200 ease-in-out"
            >
              {isLoading ? 'Connecting...' : 'Connect Wallet'}
            </button>
          )}
        </div>
      </div>
      
      <ConnectModal 
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onConnect={handleConnect}
      />
    </>
  );
};

export default Navbar;