"use client";

import React, { useState, useEffect } from 'react';
import { getUserByWalletAddress } from '@/lib/actions/user.actions';

export default function TestPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if wallet is connected
    const checkWallet = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        } catch (err) {
          console.error("Error checking wallet:", err);
        }
      }
    };
    
    checkWallet();
  }, []);

  const handleCheckUser = async () => {
    if (!walletAddress) {
      setError("Wallet not connected");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const user = await getUserByWalletAddress(walletAddress);
      setUsers([user]);
    } catch (err: any) {
      console.error("Error fetching user:", err);
      setError(err.message || "Failed to fetch user");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Wallet Connection Test</h1>
      
      <div className="mb-6 p-4 bg-[#161b22] border border-[#30363d] rounded-md">
        <h2 className="text-lg font-semibold mb-2">Current Connection</h2>
        {walletAddress ? (
          <p className="text-white">Connected: {walletAddress}</p>
        ) : (
          <p className="text-[#8b949e]">No wallet connected</p>
        )}
      </div>
      
      <div className="mb-6">
        <button 
          onClick={handleCheckUser}
          disabled={isLoading || !walletAddress}
          className="py-2 px-4 bg-[#238636] hover:bg-[#2ea043] disabled:bg-[#2c3a33] disabled:text-[#8b949e] border border-[#238636] text-white font-medium rounded-md transition duration-200 ease-in-out"
        >
          {isLoading ? 'Checking...' : 'Check User in Database'}
        </button>
      </div>
      
      {error && (
        <div className="mb-6 p-4 bg-[#301f21] border border-[#f85149] text-[#f85149] rounded-md">
          {error}
        </div>
      )}
      
      {users.length > 0 && (
        <div className="p-4 bg-[#161b22] border border-[#30363d] rounded-md">
          <h2 className="text-lg font-semibold mb-4">User Details</h2>
          <pre className="overflow-auto bg-[#0d1117] p-4 rounded-md">
            {JSON.stringify(users, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}